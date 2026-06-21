import fs from "node:fs/promises";
import path from "node:path";

const readAgentJson = async () => {
  const filePath = path.resolve(process.cwd(), "voicyy-demo.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const cfg = await readAgentJson();
    const widget = cfg?.platform_settings?.widget || {};
    const avatar = widget?.avatar || {};

    return res.status(200).json({
      agent_id: cfg?.agent_id || null,
      name: cfg?.name || null,
      first_message: cfg?.conversation_config?.agent?.first_message || null,
      colors: {
        primary: "#ffffff",
        secondary: "#0077b6",
        orb_1: avatar?.color_1 || "#00b4d8",
        orb_2: avatar?.color_2 || "#0077b6",
      },
    });
  } catch (e) {
    return res.status(500).json({ error: "Invalid demo config", details: e?.message });
  }
}
