-- Run this once in the Supabase SQL editor to create the table the
-- /api/subscribe endpoint writes to. Safe to re-run; existing tables
-- get the templates column added.

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  email text not null,
  table_count integer not null default 20,
  templates text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table restaurants
  add column if not exists templates text[] not null default '{}';

-- Holds the full menu state (name, tagline, items, categories, template, palette).
-- Populated by /api/subscribe when the onboarding cart submits, and read by
-- /api/menu so phones scanning the table QRs can render without localStorage.
alter table restaurants
  add column if not exists menu jsonb;

-- Per-restaurant secret. Gates the two operations a stranger must NOT be able
-- to perform with only a (publicly printed) slug:
--   * managing the kitchen queue   (GET/PATCH /api/orders)
--   * re-publishing the menu        (POST /api/update-menu)
-- Minted by /api/subscribe, embedded in the kitchen QR/link, and persisted
-- client-side so the builder can re-publish edits.
alter table restaurants
  add column if not exists owner_token text;

create index if not exists restaurants_email_idx on restaurants(email);

-- Backfill tokens for any rows that predate the column, so existing kitchens
-- and menus can be secured without re-provisioning. Run once; harmless after.
update restaurants
  set owner_token = encode(gen_random_bytes(18), 'hex')
  where owner_token is null;

-- Orders flow from the customer menu (POST /api/orders) into the kitchen
-- display (GET /api/orders?r=slug). The KDS PATCHes status as the ticket
-- moves: new → cooking → ready → done. The list query filters out "done"
-- so completed orders disappear from the kitchen queue.
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_slug text not null,
  table_number integer not null default 0,
  items jsonb not null,
  note text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_slug_status_idx on orders(restaurant_slug, status, created_at);

-- Defense in depth: every server endpoint reaches Supabase with the service
-- role key, which BYPASSES row level security. Enabling RLS with no policies
-- therefore changes nothing for the API, but slams the door on the anon /
-- authenticated keys — so if a browser-side query is ever added by mistake,
-- it reads and writes nothing instead of exposing these tables wide open.
alter table restaurants enable row level security;
alter table orders      enable row level security;
