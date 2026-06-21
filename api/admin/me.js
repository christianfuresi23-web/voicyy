import { requireAdminAuth } from "../_adminAuth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const v = requireAdminAuth(req, res);
  if (!v.ok) return;
  return res.status(200).json({ ok: true });
}
