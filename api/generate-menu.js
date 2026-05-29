// Vercel serverless function: brief → complete menu.
// Takes a one-sentence description, returns a full menu JSON the builder can
// use directly. Same architecture as extract-menu.js.

const SYSTEM_PROMPT = `You generate a complete restaurant menu from a one-sentence brief.

Return ONLY a valid JSON object matching this exact shape:
{
  "name": "Restaurant name (invent something tasteful, not the brief verbatim)",
  "tagline": "Short headline, 3-6 words",
  "subtagline": "Single sentence under 18 words, evocative not generic",
  "categories": ["Category 1", "Category 2", "Category 3", "Category 4"],
  "items": [
    {
      "name": "Dish name in title case",
      "price": 12.50,
      "description": "1-2 sentence description",
      "category": "Category 1",
      "spice": 0,
      "tags": ["vegetarian"]
    }
  ],
  "suggested": { "template": "sprout", "palette": "forest" }
}

Rules:
- 8-14 items across 3-5 categories. Prices appropriate for the cuisine and price tier ($4-$45 typical).
- Descriptions written like a real restaurant menu: ingredient-led, no marketing fluff, no exclamation marks.
- spice is 0-3 from words like "mild" (1), "spicy" (2), "very hot" (3).
- tags from this allowed list only: "vegetarian", "vegan", "gluten-free", "spicy", "contains-nuts", "contains-shellfish", "contains-dairy". Empty array if none apply.
- For "suggested.template" pick the best fit from EXACTLY this list:
  "purr"     (cafe / quick-serve counter with cart panel),
  "sprout"   (market / grocery / bakery with filter rail),
  "chain"    (multi-location chain / promo storefront),
  "boutique" (tasting menu / signature shop with editorial filters and stars),
  "shack"    (burgers / shakes / bold modernist diner).
- For "suggested.palette" pick from EXACTLY this list:
  "peach"     (warm peach + candied orange, dashboard),
  "forest"    (warm linen + deep forest green, market),
  "evergreen" (white + Starbucks evergreen, chain),
  "spa"       (ivory + deep botanical green, boutique),
  "shack"     (off-white + mint, Shake Shack vibes),
  "ink"       (midnight ink + warm amber, dark mode),
  "noir"      (warm linen + true black, high contrast).
- Match the suggested template to the cuisine: "purr" for cafes/coffee, "sprout" for groceries/bakeries/pantry, "chain" for multi-location promo brands, "boutique" for tasting menus and signature shops, "shack" for burgers/shakes/diners.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: "AI is not configured on this server." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const brief = body && typeof body.brief === "string" ? body.brief.trim() : "";
  if (!brief || brief.length < 8) return res.status(400).json({ error: "Provide a brief at least 8 characters long." });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Brief: ${brief.slice(0, 600)}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
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

    const ALLOWED_TEMPLATES = new Set(["purr", "sprout", "chain", "boutique", "shack"]);
    const ALLOWED_PALETTES  = new Set(["peach", "forest", "evergreen", "spa", "shack", "ink", "noir"]);

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    const clean = items
      .filter(it => it && typeof it.name === "string" && it.name.trim() && typeof it.price === "number" && it.price > 0)
      .map(it => ({
        name: String(it.name).trim(),
        price: Number(it.price),
        description: String(it.description || "").trim(),
        category: String(it.category || "Menu").trim() || "Menu",
        spice: Math.max(0, Math.min(3, Math.round(Number(it.spice) || 0))),
        tags: Array.isArray(it.tags) ? it.tags.filter(t => typeof t === "string").slice(0, 4) : [],
      }))
      .slice(0, 20);

    const cats = Array.isArray(parsed.categories) ? parsed.categories.filter(c => typeof c === "string") : [...new Set(clean.map(i => i.category))];
    const suggested = parsed.suggested || {};
    const tpl = ALLOWED_TEMPLATES.has(suggested.template) ? suggested.template : "sprout";
    const pal = ALLOWED_PALETTES.has(suggested.palette) ? suggested.palette : "forest";

    return res.status(200).json({
      name:       String(parsed.name || "").trim() || "Your Restaurant",
      tagline:    String(parsed.tagline || "").trim(),
      subtagline: String(parsed.subtagline || "").trim(),
      categories: cats,
      items:      clean,
      suggested:  { template: tpl, palette: pal },
    });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : "Unknown error" });
  }
};
