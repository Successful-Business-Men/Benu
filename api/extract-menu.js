// Vercel serverless function: POST raw menu text, get back structured items.
// Requires OPENAI_API_KEY in Vercel → Settings → Environment Variables.
//
// Runtime: Node 20 (Vercel default). Uses global fetch. CommonJS so no package.json
// or "type": "module" is required.

const SYSTEM_PROMPT = `You extract structured menu items from raw text scraped out of a restaurant menu PDF.

Return ONLY a JSON object matching this shape:
{
  "items": [
    {
      "name": "Dish name in title case",
      "price": 12.50,
      "description": "Short description, 1-2 sentences, or empty string",
      "category": "Category name (Appetizers, Mains, Sides, Drinks, Dessert, Pizza, Pasta, etc.)",
      "spice": 0
    }
  ]
}

Rules:
- Skip anything that is not a menu item: hours of operation, address, phone, allergen notices, page numbers, dietary symbols legend, marketing copy, headings without prices.
- Use the categories present in the source text. If unclear, use "Menu".
- price is a number in the menu's own currency unit (do not convert). Whole-dollar prices are fine (e.g. 12).
- spice is 0-3 estimated from words like "mild" (1), "spicy" (2), "hot/extra spicy/very hot" (3); 0 if not mentioned.
- Do not invent items that are not in the text.
- Return at most 80 items.
- If the same dish is listed twice (multiple sizes), pick the most common size or the first listed.`;

const MODEL = "gpt-4o-mini";
const MAX_INPUT_CHARS = 16000;

module.exports = async function handler(req, res) {
  // CORS: same-origin in prod, but allow OPTIONS preflight so local dev works.
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(503).json({ error: "AI extraction is not configured on this server." });
  }

  let body = req.body;
  // Vercel auto-parses JSON; if it didn't (e.g. text/plain), parse ourselves.
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = body && typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return res.status(400).json({ error: "Body must include a non-empty 'text' field." });
  }

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text.slice(0, MAX_INPUT_CHARS) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      if (openaiRes.status === 401) return res.status(502).json({ error: "OpenAI rejected the server's key." });
      if (openaiRes.status === 429) return res.status(429).json({ error: "OpenAI rate limit hit. Try again in a moment." });
      return res.status(502).json({ error: `OpenAI ${openaiRes.status}: ${errText.slice(0, 200)}` });
    }

    const data = await openaiRes.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) return res.status(502).json({ error: "Empty response from OpenAI." });

    let parsed;
    try { parsed = JSON.parse(content); }
    catch { return res.status(502).json({ error: "OpenAI returned malformed JSON." }); }

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const clean = items
      .filter(it => it && typeof it.name === "string" && it.name.trim() && typeof it.price === "number" && it.price > 0)
      .map(it => ({
        name: String(it.name).trim(),
        price: Number(it.price),
        description: String(it.description || "").trim(),
        category: String(it.category || "Menu").trim() || "Menu",
        spice: Math.max(0, Math.min(3, Math.round(Number(it.spice) || 0))),
      }));

    return res.status(200).json({ items: clean });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : "Unknown error" });
  }
};
