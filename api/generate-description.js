// Per-item description writer + dietary tagger.
// Input: { name, category, voice } — voice maps to the template's tone.
// Output: { description, tags }

const VOICE_GUIDES = {
  editorial: "Editorial / ingredient-led. 1-2 sentences, no marketing fluff, no exclamation marks. Specific ingredients over abstract praise.",
  luxury:    "Luxury fine dining. One italic-leaning sentence, very restrained, ingredient-only. Skip adjectives like 'delicious' or 'amazing'.",
  casual:    "Casual & friendly. 1-2 short sentences. Approachable but specific about what's in the dish.",
  delivery:  "Functional. One sentence stating what's in the dish, no flourish. Good for delivery apps.",
};

const SYSTEM_PROMPT = `You write restaurant menu item descriptions and tag dietary attributes.

Return ONLY a JSON object matching this exact shape:
{
  "description": "1-2 sentences describing the dish",
  "tags": ["vegetarian"]
}

Rules:
- description follows the voice guide given in the user message.
- description is 1-2 sentences. Ingredient-focused. No exclamation marks. No "made with love".
- tags from this allowed list only: "vegetarian", "vegan", "gluten-free", "spicy", "contains-nuts", "contains-shellfish", "contains-dairy". Empty array if none apply.
- Do not invent ingredients the dish wouldn't have. If the dish name is ambiguous, write a plausible description for the most common preparation.`;

const ALLOWED_TAGS = new Set(["vegetarian", "vegan", "gluten-free", "spicy", "contains-nuts", "contains-shellfish", "contains-dairy"]);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: "AI is not configured on this server." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const name = body && typeof body.name === "string" ? body.name.trim() : "";
  const category = body && typeof body.category === "string" ? body.category.trim() : "";
  const voiceKey = body && typeof body.voice === "string" ? body.voice : "editorial";
  if (!name || name.length < 2) return res.status(400).json({ error: "Provide a dish name at least 2 characters long." });

  const voice = VOICE_GUIDES[voiceKey] || VOICE_GUIDES.editorial;
  const userPrompt = `Voice: ${voice}\nDish name: ${name}${category ? `\nCategory: ${category}` : ""}`;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      }),
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      if (r.status === 401) return res.status(502).json({ error: "OpenAI rejected the server's key." });
      if (r.status === 429) return res.status(429).json({ error: "OpenAI rate limit hit. Try again in a moment." });
      return res.status(502).json({ error: `OpenAI ${r.status}: ${txt.slice(0, 200)}` });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: "Empty response from OpenAI." });

    let parsed;
    try { parsed = JSON.parse(content); } catch { return res.status(502).json({ error: "OpenAI returned malformed JSON." }); }

    const description = String(parsed.description || "").trim();
    const rawTags = Array.isArray(parsed.tags) ? parsed.tags : [];
    const tags = rawTags
      .filter(t => typeof t === "string" && ALLOWED_TAGS.has(t.toLowerCase()))
      .map(t => t.toLowerCase())
      .slice(0, 4);

    return res.status(200).json({ description, tags });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : "Unknown error" });
  }
};
