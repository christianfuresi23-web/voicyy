import { clearAdminSessionCookie } from "../_adminAuth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const proto = (req.headers["x-forwarded-proto"] || "").toString();
  const secure = proto === "https" || process.env.NODE_ENV === "production";
  clearAdminSessionCookie(res, { secure });
  return res.status(200).json({ ok: true });
}
