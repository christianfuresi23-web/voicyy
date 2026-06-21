import crypto from "node:crypto";
import { createAdminSessionToken, setAdminSessionCookie } from "../_adminAuth.js";

const readJsonBody = async (req) => {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const base32Decode = (base32) => {
  const str = String(base32 || "").replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (let i = 0; i < str.length; i += 1) {
    const val = BASE32_CHARS.indexOf(str[i]);
    if (val < 0) throw new Error("Invalid base32 character");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return Buffer.from(bytes);
};

const intToBytes = (num) => {
  const arr = Buffer.alloc(8);
  let tmp = num;
  for (let i = 7; i >= 0; i -= 1) {
    arr[i] = tmp & 0xff;
    tmp = Math.floor(tmp / 256);
  }
  return arr;
};

const generateTOTP = ({ secret, counter }) => {
  const key = base32Decode(secret);
  const hmac = crypto.createHmac("sha1", key).update(intToBytes(counter)).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
};

const verifyTOTP = ({ secret, token, window = 1, timeStep = 30 }) => {
  const t = String(token || "").replace(/\D/g, "").slice(0, 6);
  if (t.length !== 6) return false;
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  for (let i = -window; i <= window; i += 1) {
    if (generateTOTP({ secret, counter: counter + i }) === t) return true;
  }
  return false;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const totpSecret = process.env.ADMIN_TOTP_SECRET;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword) return res.status(500).json({ error: "Admin auth not configured (missing ADMIN_PASSWORD)" });
  if (!totpSecret) return res.status(500).json({ error: "Admin auth not configured (missing ADMIN_TOTP_SECRET)" });
  if (!sessionSecret) return res.status(500).json({ error: "Admin auth not configured (missing ADMIN_SESSION_SECRET)" });

  const body = await readJsonBody(req);
  const password = String(body?.password || "");
  const totp = String(body?.totp || "");

  if (!password || !totp) return res.status(400).json({ error: "Missing password/totp" });

  if (password !== adminPassword) return res.status(401).json({ error: "Invalid credentials" });
  if (!verifyTOTP({ secret: totpSecret, token: totp })) return res.status(401).json({ error: "Invalid credentials" });

  const tokenValue = createAdminSessionToken({ secret: sessionSecret });
  const proto = (req.headers["x-forwarded-proto"] || "").toString();
  const secure = proto === "https" || process.env.NODE_ENV === "production";
  setAdminSessionCookie(res, tokenValue, { secure });
  return res.status(200).json({ ok: true });
}
