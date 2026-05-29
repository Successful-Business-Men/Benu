// AI design review of the current menu state.
// Input: { state } — the same shape the builder uses (name, tagline, categories, items, template).
// Output: { findings: [{ severity, message, item?, category? }] }

const SYSTEM_PROMPT = `You are a senior restaurant menu designer reviewing a menu draft.

Return ONLY a JSON object matching this exact shape:
{
  "findings": [
    {
      "severity": "info" | "warning" | "critical",
      "message": "Concrete, specific feedback. State the problem AND the fix.",
      "item": "Dish name (optional, when the finding is about one item)",
      "category": "Category name (optional, when the finding is about one category)"
    }
  ]
}

Rules:
- Return 4-10 findings. Each must be actionable. No vague platitudes like "consider improving descriptions".
- Look for:
  * Inconsistent voice (one item is poetic, another is functional — pick a lane)
  * Categories with only 1-2 items (might be combinable)
  * Missing prices, suspiciously round prices, prices that don't match the cuisine tier
  * Generic / placeholder names ("Sample Dish A")
  * Empty descriptions on items that need them (especially in editorial templates)
  * Wrong template for the cuisine type (e.g. fine dining on the Delivery template)
  * Tagline or subtagline that's generic or doesn't match the cuisine
- severity: "critical" for things actively wrong (no prices, broken category), "warning" for inconsistencies, "info" for nice-to-haves.
- Cite specific dish names or category names in the message itself, not just in the item/category fields.`;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: "AI is not configured on this server." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const state = body && body.state ? body.state : null;
  if (!state || !Array.isArray(state.items)) return res.status(400).json({ error: "Provide a state with items[]." });

  // Strip data-URL images so we don't blow up the payload.
  const slim = {
    name: state.name,
    tagline: state.tagline,
    subtagline: state.subtagline,
    template: state.template,
    palette: state.palette,
    categories: state.categories,
    items: state.items.map(i => ({
      name: i.name,
      price: i.price,
      description: i.description,
      category: i.category,
      spice: i.spice,
      tags: i.tags,
    })),
  };

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Review this menu draft:\n\n" + JSON.stringify(slim, null, 2) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
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

    const ALLOWED_SEV = new Set(["info", "warning", "critical"]);
    const findings = (Array.isArray(parsed.findings) ? parsed.findings : [])
      .filter(f => f && typeof f.message === "string" && f.message.trim())
      .map(f => ({
        severity: ALLOWED_SEV.has(f.severity) ? f.severity : "info",
        message: String(f.message).trim(),
        item: f.item ? String(f.item).trim() : undefined,
        category: f.category ? String(f.category).trim() : undefined,
      }))
      .slice(0, 12);

    return res.status(200).json({ findings });
  } catch (err) {
    return res.status(500).json({ error: err && err.message ? err.message : "Unknown error" });
  }
};
