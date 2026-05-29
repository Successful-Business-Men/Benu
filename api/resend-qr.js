// Re-issues the QR pack for an existing subscriber. The new PDF embeds
// the URL of *this* request — whatever host the owner used to reach
// /resend.html — so they can recover from an earlier subscription that
// baked in an unreachable URL.

const { createClient } = require("@supabase/supabase-js");
const { baseUrl, sendQrPack, makeToken } = require("../lib/qr-pack");
const { STARTER_MENU } = require("../lib/starter-menu");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const email = typeof body.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Enter a valid email." });

  const supabase = sb();
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  // Pick the most recent subscription for this email — supports the case
  // where someone signed up twice and only the newest record matters.
  const { data, error } = await supabase
    .from("restaurants")
    .select("slug, templates, menu, owner_token")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "No subscription found for that email." });

  // Legacy rows from before owner tokens existed: mint one now and persist it
  // so the regenerated kitchen link is authenticated. The owner gets the new
  // link in this very email, so nothing is stranded.
  let ownerToken = data.owner_token;
  if (!ownerToken) {
    ownerToken = makeToken();
    const { error: tokErr } = await supabase
      .from("restaurants")
      .update({ owner_token: ownerToken })
      .eq("slug", data.slug);
    if (tokErr) console.error("[resend-qr] token backfill failed:", tokErr.message);
  }

  // Backfill a starter menu if this row never had one — covers everyone
  // who originally signed up via the landing-page form, where the QR
  // would otherwise land on "this menu hasn't been published yet".
  if (!data.menu) {
    const starter = JSON.parse(JSON.stringify(STARTER_MENU));
    if (data.templates && data.templates[0]) starter.template = data.templates[0];
    const { error: upErr } = await supabase
      .from("restaurants")
      .update({ menu: starter })
      .eq("slug", data.slug);
    if (upErr) console.error("[resend-qr] starter backfill failed:", upErr.message);
  }

  const origin = baseUrl(req);

  try {
    const { menuPreviewUrl, kdsUrl } = await sendQrPack({
      to: email,
      slug: data.slug,
      origin,
      isResend: true,
      token: ownerToken,
    });
    console.log("[resend-qr] sent", JSON.stringify({ slug: data.slug, email, origin, ts: new Date().toISOString() }));
    return res.status(200).json({ ok: true, slug: data.slug, origin, menuPreviewUrl, kdsUrl, ownerToken });
  } catch (err) {
    console.error("[resend-qr] failed:", err && err.message);
    return res.status(502).json({ error: (err && err.message) || "Could not send email." });
  }
};
