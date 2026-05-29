// Orders pipeline: customer menu → kitchen display.
// Routes by HTTP method:
//   POST   /api/orders          body: { slug, table, items: [{ name, price, qty }], note? }
//   GET    /api/orders?r=slug&k=token   → { orders: [...] }, only active statuses
//   PATCH  /api/orders          body: { id, status, slug, token }
//
// Trust model:
//   POST is OPEN — any customer who scanned a table QR can place an order.
//   GET (read the live queue) and PATCH (advance a ticket) are STAFF actions,
//   so they require the restaurant's owner token. The token rides in the
//   kitchen link (&k=) the owner received by email; customers never see it.
//
// Uses the same Supabase env vars as /api/subscribe.

const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const ALLOWED_STATUSES = ["new", "cooking", "ready", "done"];
const ACTIVE_STATUSES = ["new", "cooking", "ready"];
const MAX_ITEMS = 40;

// Rate limit on order creation, per restaurant. A real kitchen rarely sees
// more than a handful of orders a minute; this caps abusive bursts without
// getting in a busy service's way. Backed by the orders table itself so it
// holds across serverless instances.
const RL_WINDOW_MS = 60_000;
const RL_MAX = 30;

function sb() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function clean(v, n) { return typeof v === "string" ? v.trim().slice(0, n) : ""; }
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// Constant-time string compare so a token check can't be probed byte-by-byte.
function tokenMatches(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Verifies the caller holds the owner token for `slug`. Returns null on
// success, or { status, error } describing the failure to hand straight back.
async function requireOwner(supabase, slug, token) {
  if (!slug) return { status: 400, error: "Missing slug." };
  const { data, error } = await supabase
    .from("restaurants")
    .select("owner_token")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return { status: 500, error: error.message };
  if (!data) return { status: 404, error: "Unknown restaurant." };
  // Legacy rows (provisioned before tokens existed and never resent) have a
  // null token. Allow them through so existing kitchens keep working, but log
  // it — running the schema's backfill closes this gap permanently.
  if (!data.owner_token) {
    console.warn("[orders] legacy restaurant without owner_token:", slug);
    return null;
  }
  if (!tokenMatches(token, data.owner_token)) return { status: 401, error: "Unauthorized." };
  return null;
}

async function readBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

module.exports = async function handler(req, res) {
  const supabase = sb();
  if (!supabase) return res.status(503).json({ error: "Supabase not configured." });

  if (req.method === "GET") {
    const slug = clean(req.query && req.query.r, 80);
    const token = clean(req.query && req.query.k, 80);
    const denied = await requireOwner(supabase, slug, token);
    if (denied) return res.status(denied.status).json({ error: denied.error });

    const { data, error } = await supabase
      .from("orders")
      .select("id, table_number, items, note, status, created_at")
      .eq("restaurant_slug", slug)
      .in("status", ACTIVE_STATUSES)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[orders] list failed:", error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ orders: data || [] });
  }

  if (req.method === "POST") {
    const body = await readBody(req);
    const slug = clean(body.slug, 80);
    if (!slug) return res.status(400).json({ error: "Missing slug." });

    // Order creation is open, so guard it with a per-restaurant rate limit:
    // reject if this slug already booked RL_MAX orders inside the window.
    const since = new Date(Date.now() - RL_WINDOW_MS).toISOString();
    const { count, error: countErr } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_slug", slug)
      .gte("created_at", since);
    if (countErr) {
      console.error("[orders] rate-limit check failed:", countErr.message);
    } else if ((count || 0) >= RL_MAX) {
      return res.status(429).json({ error: "Too many orders just now. Try again in a minute." });
    }

    const table = Math.max(0, Math.min(999, Math.floor(num(body.table))));
    const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
    const items = rawItems.map((it) => ({
      name: clean(it && it.name, 120),
      price: num(it && it.price),
      qty: Math.max(1, Math.min(50, Math.floor(num(it && it.qty) || 1))),
    })).filter((it) => it.name);
    if (!items.length) return res.status(400).json({ error: "No items." });

    const note = clean(body.note, 280);

    const { data, error } = await supabase
      .from("orders")
      .insert({ restaurant_slug: slug, table_number: table, items, note, status: "new" })
      .select("id, created_at")
      .single();
    if (error) {
      console.error("[orders] insert failed:", error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true, id: data.id });
  }

  if (req.method === "PATCH") {
    const body = await readBody(req);
    const id = clean(body.id, 80);
    const status = clean(body.status, 20);
    const slug = clean(body.slug, 80);
    const token = clean(body.token, 80);
    if (!id || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid id or status." });
    }
    const denied = await requireOwner(supabase, slug, token);
    if (denied) return res.status(denied.status).json({ error: denied.error });

    // Scope the update to this restaurant's slug so a valid token for one
    // restaurant can't touch another restaurant's tickets.
    const { error } = await supabase
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("restaurant_slug", slug);
    if (error) {
      console.error("[orders] update failed:", error.message);
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
