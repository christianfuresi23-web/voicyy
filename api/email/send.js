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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) return res.status(500).json({ error: "Email not configured (missing RESEND_API_KEY)" });

  const body = await readJsonBody(req);
  const to = body?.to;
  const subject = body?.subject;
  const text = body?.text;
  const html = body?.html;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ error: "Missing to/subject/body" });
  }

  const from = process.env.RESEND_FROM_EMAIL || "Voicyy <onboarding@resend.dev>";

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: text || undefined,
      html: html || (text ? `<pre style=\"font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; white-space:pre-wrap;\">${String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</pre>` : undefined),
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return res.status(resp.status).json({ error: data?.message || "Email send failed", details: data });

  return res.status(200).json({ ok: true, data });
}

