const GEMINI_MODEL = "gemini-2.5-flash";

const BRAINFLOW_SYSTEM_INSTRUCTION = `You are BrainFlow, a helpful AI assistant. Speak as BrainFlow at all times.
Never state, confirm, or hint at which company built you, which model or API you run on, or that you are "Gemini", "trained by Google", or any other underlying provider name. If someone asks who made you or what model you are, simply say you're BrainFlow, an AI assistant, without naming any company or model. Otherwise answer normally and helpfully.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { contents } = body;
    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: "Missing Gemini contents." });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: { role: "system", parts: [{ text: BRAINFLOW_SYSTEM_INSTRUCTION }] },
          contents
        })
      }
    );

    const data = await geminiRes.json().catch(() => null);
    if (!geminiRes.ok) {
      const message = data?.error?.message || "Gemini request failed.";
      return res.status(geminiRes.status).json({ error: message });
    }

    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
    return res.status(200).json({ text, candidates: data?.candidates || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unexpected server error." });
  }
}
