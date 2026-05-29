// Lead / subscribe-intent capture.
// Input: { type, email, restaurant, message, plan }
//   type    — "subscribe" (pricing CTA) or "build-request" (done-for-you form)
//   email   — required
//   plan    — optional (e.g. "publish")
// Forwards to LEAD_WEBHOOK_URL (Slack/Discord/Zapier-compatible) when set,
// always logs to the function output, and returns { ok: true }.
// No DB required — this is intentionally a capture-only endpoint.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const email = clean(body.email, 200);
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email." });

  const lead = {
    type: clean(body.type, 40) || "subscribe",
    email,
    restaurant: clean(body.restaurant, 200),
    message: clean(body.message, 2000),
    plan: clean(body.plan, 40),
    ts: new Date().toISOString(),
    ref: clean(req.headers && req.headers.referer, 300),
    ua: clean(req.headers && req.headers["user-agent"], 300),
  };

  // Always land in the function logs so no lead is ever silently dropped.
  console.log("[lead]", JSON.stringify(lead));

  const hook = process.env.LEAD_WEBHOOK_URL;
  if (hook) {
    const summary = lead.type === "build-request"
      ? `New build request from ${lead.restaurant || "a restaurant"} <${lead.email}>`
      : `New subscribe intent <${lead.email}>${lead.plan ? ` (${lead.plan})` : ""}`;
    try {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // text -> Slack, content -> Discord, lead -> generic consumers.
        body: JSON.stringify({ text: summary, content: summary, lead }),
      });
    } catch (err) {
      // A broken webhook must never cost us the lead — it's already logged.
      console.error("[lead] webhook failed:", err && err.message);
    }
  }

  return res.status(200).json({ ok: true });
};
