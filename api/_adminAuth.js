import crypto from "node:crypto";

const COOKIE_NAME = "voicyy_admin_session";

const base64url = (buf) =>
  Buffer.from(buf)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64urlToBuffer = (str) => {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  return Buffer.from(b64, "base64");
};

const safeEqual = (a, b) => {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
};

const sign = (secret, payloadB64) => {
  return base64url(crypto.createHmac("sha256", secret).update(payloadB64).digest());
};

export const createAdminSessionToken = ({ secret, ttlSeconds = 60 * 60 * 24 * 7 }) => {
  const now = Math.floor(Date.now() / 1000);
  const payload = { exp: now + ttlSeconds, iat: now };
  const payloadB64 = base64url(JSON.stringify(payload));
  const sig = sign(secret, payloadB64);
  return `${payloadB64}.${sig}`;
};

export const verifyAdminSessionToken = ({ secret, token }) => {
  if (!token || typeof token !== "string") return { ok: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false };
  const [payloadB64, sig] = parts;
  const expected = sign(secret, payloadB64);
  if (!safeEqual(expected, sig)) return { ok: false };
  let payload;
  try {
    payload = JSON.parse(base64urlToBuffer(payloadB64).toString("utf8"));
  } catch {
    return { ok: false };
  }
  const now = Math.floor(Date.now() / 1000);
  if (!payload?.exp || now > payload.exp) return { ok: false };
  return { ok: true, payload };
};

export const parseCookies = (cookieHeader) => {
  const out = {};
  const raw = String(cookieHeader || "");
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join("=") || "");
  }
  return out;
};

export const getAdminSessionCookie = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[COOKIE_NAME] || "";
};

export const setAdminSessionCookie = (res, token, { secure } = {}) => {
  const s = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${secure ? "; Secure" : ""}`;
  const prev = res.getHeader("Set-Cookie");
  if (!prev) res.setHeader("Set-Cookie", s.trim());
  else if (Array.isArray(prev)) res.setHeader("Set-Cookie", [...prev, s.trim()]);
  else res.setHeader("Set-Cookie", [prev, s.trim()]);
};

export const clearAdminSessionCookie = (res, { secure } = {}) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
};

export const requireAdminAuth = (req, res) => {
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    res.status(500).json({ error: "Admin auth not configured (missing ADMIN_SESSION_SECRET)" });
    return { ok: false };
  }
  const token = getAdminSessionCookie(req);
  const v = verifyAdminSessionToken({ secret: sessionSecret, token });
  if (!v.ok) {
    res.status(401).json({ error: "Unauthorized" });
    return { ok: false };
  }
  return { ok: true, payload: v.payload };
};
