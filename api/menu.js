// Returns the stored menu state for a restaurant slug, so the customer
// /menu.html?r=<slug>&t=<n> URLs work on a phone that has no localStorage
// for this account. The shape mirrors BMStore.save() in js/store.js.

const { createClient } = require("@supabase/supabase-js");

function sb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function clean(v, n) { return typeof v === "string" ? v.trim().slice(0, n) : ""; }

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const slug = clean(req.query && req.query.r, 80);
  if (!slug) return res.status(400).json({ error: "Missing ?r=slug" });

  const supabase = sb();
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  const { data, error } = await supabase
    .from("restaurants")
    .select("slug, email, menu, templates")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[menu] lookup failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
  if (!data) return res.status(404).json({ error: "Unknown restaurant." });

  // Cache briefly — the menu changes rarely, but we don't want stale data
  // sticking around if the owner edits and re-publishes.
  res.setHeader("Cache-Control", "public, max-age=10, s-maxage=10");
  return res.status(200).json({ slug: data.slug, menu: data.menu || null });
};
