// Provisions a restaurant: validates the email, mints a slug, writes a
// row to Supabase, and ships the QR pack via lib/qr-pack.

const { createClient } = require("@supabase/supabase-js");
const {
  TABLE_COUNT,
  TEMPLATE_LABELS,
  makeSlug,
  makeToken,
  baseUrl,
  sendQrPack,
} = require("../lib/qr-pack");
const { STARTER_MENU } = require("../lib/starter-menu");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEMPLATES = 2;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email." });

  const rawTemplates = Array.isArray(body.templates) ? body.templates : [];
  const templates = [...new Set(
    rawTemplates.filter((t) => typeof t === "string" && Object.prototype.hasOwnProperty.call(TEMPLATE_LABELS, t))
  )].slice(0, MAX_TEMPLATES);

  // If the caller didn't bring a menu (e.g. landing-page signup that only
  // collected email) install a sensible starter so the QR codes resolve
  // to something usable. The owner can replace it later via the builder.
  // If a shortlisted template was provided, honor it for the starter so
  // the customer scan immediately lands on the layout they liked.
  let menu = body.menu && typeof body.menu === "object" ? body.menu : null;
  if (!menu) {
    menu = JSON.parse(JSON.stringify(STARTER_MENU));
    if (templates[0]) menu.template = templates[0];
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(503).json({ error: "Supabase is not configured on this deploy." });
  if (!RESEND_API_KEY) return res.status(503).json({ error: "Resend is not configured on this deploy." });

  const slug = makeSlug();
  const ownerToken = makeToken();
  const origin = baseUrl(req);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.from("restaurants").insert({
      slug, email, table_count: TABLE_COUNT, templates, menu, owner_token: ownerToken,
    });
    if (error) console.error("[subscribe] supabase insert failed:", error.message);
  } catch (err) {
    // Logging-only: a DB miss shouldn't cost the user their welcome email.
    console.error("[subscribe] supabase error:", err && err.message);
  }

  try {
    const { menuPreviewUrl, kdsUrl } = await sendQrPack({ to: email, slug, origin, isResend: false, token: ownerToken });
    console.log("[subscribe] provisioned", JSON.stringify({ slug, email, origin, ts: new Date().toISOString() }));
    // ownerToken is returned so the browser that just signed up can persist it
    // and re-publish menu edits later via /api/update-menu. It is a secret —
    // it never appears in customer-facing URLs, only here and in the email.
    return res.status(200).json({ ok: true, slug, origin, menuPreviewUrl, kdsUrl, ownerToken });
  } catch (err) {
    console.error("[subscribe] send failed:", err && err.message);
    return res.status(502).json({ error: (err && err.message) || "Could not send email." });
  }
};
