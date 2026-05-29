// Re-publishes an existing restaurant's menu. This is what lets an owner edit
// in the builder and push the result to Supabase WITHOUT minting a new slug or
// a new QR pack — the original table codes keep resolving to the latest menu.
//
//   POST /api/update-menu   body: { slug, token, menu, templates? }
//
// Gated by the owner token (the same secret that protects the kitchen queue),
// so only someone holding the restaurant's credentials can overwrite its menu.

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const MAX_TEMPLATES = 2;
const TEMPLATE_KEYS = ["purr", "sprout", "chain", "boutique", "shack"];

function sb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function clean(v, n) { return typeof v === "string" ? v.trim().slice(0, n) : ""; }

function tokenMatches(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    return res.status(405).json({ error: "POST only" });
  }

  const supabase = sb();
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const slug = clean(body.slug, 80);
  const token = clean(body.token, 80);
  const menu = body.menu && typeof body.menu === "object" ? body.menu : null;
  if (!slug) return res.status(400).json({ error: "Missing slug." });
  if (!menu) return res.status(400).json({ error: "Missing menu." });

  const { data, error } = await supabase
    .from("restaurants")
    .select("owner_token")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Unknown restaurant." });
  // Overwriting a menu is destructive, so — unlike the orders queue — we do
  // NOT grant a legacy back-compat pass here. A row with no token must be
  // re-issued one (resend the QR pack) before its menu can be republished.
  if (!data.owner_token) {
    return res.status(409).json({ error: "This restaurant has no manage token yet. Re-send your QR pack to provision one." });
  }
  if (!tokenMatches(token, data.owner_token)) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const update = { menu };
  if (Array.isArray(body.templates)) {
    update.templates = [...new Set(
      body.templates.filter((t) => TEMPLATE_KEYS.includes(t))
    )].slice(0, MAX_TEMPLATES);
  }

  const { error: upErr } = await supabase
    .from("restaurants")
    .update(update)
    .eq("slug", slug);
  if (upErr) {
    console.error("[update-menu] update failed:", upErr.message);
    return res.status(500).json({ error: upErr.message });
  }

  return res.status(200).json({ ok: true, slug });
};
