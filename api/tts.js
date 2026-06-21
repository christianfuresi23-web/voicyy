export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TTS not configured (missing ELEVENLABS_API_KEY)" });

  const url = new URL(req.url, "http://localhost");
  const text = (url.searchParams.get("text") || "").trim();
  const voiceId = (url.searchParams.get("voice_id") || process.env.ELEVENLABS_VOICE_ID || "").trim();
  const modelId = (url.searchParams.get("model_id") || "eleven_multilingual_v2").trim();
  const stabilityRaw = url.searchParams.get("stability");
  const similarityBoostRaw = url.searchParams.get("similarity_boost");
  const speedRaw = url.searchParams.get("speed");
  const optimizeStreamingLatencyRaw = url.searchParams.get("optimize_streaming_latency");

  if (!text) return res.status(400).json({ error: "Missing text" });
  if (!voiceId) return res.status(400).json({ error: "Missing voice_id" });

  const stability = stabilityRaw == null ? undefined : Number(stabilityRaw);
  const similarity_boost = similarityBoostRaw == null ? undefined : Number(similarityBoostRaw);
  const speed = speedRaw == null ? undefined : Number(speedRaw);
  const optimize_streaming_latency = optimizeStreamingLatencyRaw == null ? undefined : Number(optimizeStreamingLatencyRaw);

  const voice_settings = {
    ...(Number.isFinite(stability) ? { stability } : null),
    ...(Number.isFinite(similarity_boost) ? { similarity_boost } : null),
    ...(Number.isFinite(speed) ? { speed } : null),
  };

  const elevenResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      ...(Object.keys(voice_settings).length ? { voice_settings } : null),
      ...(Number.isFinite(optimize_streaming_latency) ? { optimize_streaming_latency } : null),
    }),
  });

  if (!elevenResp.ok) {
    const errText = await elevenResp.text().catch(() => "");
    return res.status(elevenResp.status).json({ error: "TTS failed", details: errText });
  }

  const audioBuffer = Buffer.from(await elevenResp.arrayBuffer());
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(audioBuffer);
}
