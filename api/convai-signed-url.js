import fs from "node:fs/promises";
import path from "node:path";

const readAgentId = async () => {
  const filePath = path.resolve(process.cwd(), "voicyy-demo.json");
  const raw = await fs.readFile(filePath, "utf8");
  const cfg = JSON.parse(raw);
  return cfg?.agent_id || null;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ElevenLabs not configured (missing ELEVENLABS_API_KEY)" });

  let agentId;
  try {
    agentId = await readAgentId();
  } catch (e) {
    return res.status(500).json({ error: "Invalid demo config", details: e?.message });
  }

  if (!agentId) return res.status(400).json({ error: "Missing agent_id in voicyy-demo.json" });

  const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": apiKey,
      Accept: "application/json",
    },
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) return res.status(resp.status).json({ error: "Failed to get signed url", details: data });

  return res.status(200).json({ signed_url: data?.signed_url || null });
}
