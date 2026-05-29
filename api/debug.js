// Inspection endpoint: GET /api/debug?r=<slug>&key=<ADMIN_DEBUG_TOKEN>
//
// Reports what the server actually knows about a subscribed restaurant
// (does the row exist, does it have a menu, how many items, when was it
// created, etc.) plus the base URL this deployment would embed in fresh
// QR codes. Useful for diagnosing "the QR opens to nothing" without
// poking through Supabase by hand.
//
// It exposes order history and config, so it is gated behind an admin
// secret: set ADMIN_DEBUG_TOKEN in the environment and pass it as ?key=.
// If the env var is unset the endpoint is disabled entirely (404), so a
// deploy can't accidentally ship it wide open.

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

function tokenMatches(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function sb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function currentBaseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = (req.headers && (req.headers["x-forwarded-host"] || req.headers.host)) || "localhost:3000";
  const proto = (req.headers && req.headers["x-forwarded-proto"]) || "https";
  return `${proto}://${host}`;
}

function redactEmail(e) {
  if (!e || typeof e !== "string") return null;
  const [user, domain] = e.split("@");
  if (!domain) return "***";
  const u = user.length <= 2 ? user[0] + "*" : user[0] + "***" + user.slice(-1);
  return `${u}@${domain}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // Disabled unless an admin secret is configured, and then only for callers
  // who present it. Without the env var the route 404s as if it didn't exist.
  const ADMIN_DEBUG_TOKEN = process.env.ADMIN_DEBUG_TOKEN;
  if (!ADMIN_DEBUG_TOKEN) return res.status(404).json({ error: "Not found." });
  const key = typeof req.query?.key === "string" ? req.query.key : "";
  if (!tokenMatches(key, ADMIN_DEBUG_TOKEN)) return res.status(401).json({ error: "Unauthorized." });

  const slug = typeof req.query?.r === "string" ? req.query.r.trim().slice(0, 80) : "";
  const baseUrl = currentBaseUrl(req);

  const env = {
    base_url_in_use: baseUrl,
    BASE_URL_set: !!process.env.BASE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL || null,
    VERCEL_URL: process.env.VERCEL_URL || null,
    supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    resend_configured: !!process.env.RESEND_API_KEY,
  };

  if (!slug) return res.status(200).json({ ok: true, env, hint: "Pass ?r=<slug> to inspect a restaurant." });

  const supabase = sb();
  if (!supabase) return res.status(503).json({ error: "Supabase not configured.", env });

  const { data: r, error: rErr } = await supabase
    .from("restaurants")
    .select("slug, email, table_count, templates, menu, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (rErr) return res.status(500).json({ error: rErr.message, env });
  if (!r) return res.status(404).json({ error: "Unknown slug.", env });

  const menu = r.menu && typeof r.menu === "object" ? r.menu : null;
  const itemCount = menu && Array.isArray(menu.items) ? menu.items.length : 0;

  const { data: orders, error: oErr } = await supabase
    .from("orders")
    .select("id, status, created_at")
    .eq("restaurant_slug", slug)
    .order("created_at", { ascending: false })
    .limit(20);

  return res.status(200).json({
    ok: true,
    env,
    restaurant: {
      slug: r.slug,
      email: redactEmail(r.email),
      table_count: r.table_count,
      templates: r.templates || [],
      menu_published: !!menu,
      menu_name: menu ? menu.name || null : null,
      menu_template: menu ? menu.template || null : null,
      menu_items_count: itemCount,
      created_at: r.created_at,
    },
    sample_urls: {
      menu_table_1: `${baseUrl}/menu.html?r=${slug}&t=1`,
      kds:         `${baseUrl}/kitchen.html?r=${slug}&view=kds`,
      kitchen:     `${baseUrl}/kitchen.html?r=${slug}`,
    },
    recent_orders: oErr ? { error: oErr.message } : (orders || []),
  });
};
