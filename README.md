# Better Menu

A template-based builder for restaurant menus and matching kitchen displays.
Restaurants pick a template, pick a palette, type in their items, and get a
customer-facing menu and a kitchen view. Or they can have our team build it
for them.

## Project layout

```
.
├── index.html             Landing page
├── onboard.html           4-step guided onboarding (type → vibe → PDF → template)
├── builder.html           Editor + share link + open-menu shortcut
├── menu.html              Customer-facing menu (5 distinct templates)
├── kitchen.html           Kitchen display system
├── js/
│   ├── store.js           Shared store, templates, palettes, theme application
│   ├── images.js          Curated Unsplash photo library
│   ├── recommend.js       Maps onboarding answers to recommended template + palette
│   ├── pdf-parse.js       Heuristic PDF parser (pdf.js)
│   └── ai-extract.js      Calls /api/extract-menu for AI extraction
├── api/
│   └── extract-menu.js    Vercel serverless function: text → structured menu JSON
├── vercel.json            Clean URLs config
└── .gitignore
```

## Run locally

Static pages only:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

This serves the static site but the `/api/extract-menu` function will not
run. To test the AI extraction endpoint locally, use Vercel's CLI:

```bash
npm i -g vercel
vercel dev
# then visit http://localhost:3000
```

Set `OPENAI_API_KEY` in `.env.local` for local AI extraction.

## Deploy to Vercel

1. Push `main` to GitHub.
2. In Vercel: **New Project → Import** this repo.
3. Framework preset: **Other**. Output directory: blank.
4. **Add environment variables** (Settings → Environment Variables → Add):
   - `OPENAI_API_KEY = sk-...` — AI menu extraction/review.
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — menu + orders storage.
   - `RESEND_API_KEY` — sends the QR-pack welcome email.
   - `ADMIN_DEBUG_TOKEN` (optional) — required to use `/api/debug`. Leave it
     unset in production and the debug endpoint stays disabled (404).
5. Run `supabase/schema.sql` once in the Supabase SQL editor (creates the
   tables, mints owner tokens, and enables row level security).
6. Deploy.

The serverless function in `api/extract-menu.js` reads the key on the server.
Browsers never see it. `vercel.json` enables clean URLs (`/menu` instead of
`/menu.html`).

### Cost expectations

AI extraction uses `gpt-4o-mini`. Typical menu PDF is a few thousand input
tokens plus a short JSON response — roughly **$0.0002 per extraction**.
For a thousand uploads a month, that is about twenty cents.

If AI extraction should be free for users but you want a rate limit, add
one to the serverless function (e.g. via `@vercel/kv` or a quick IP-based
counter).

## Branch strategy

- **`main`** — production. Vercel auto-deploys from here.
- **`feature/<short-name>`** — one branch per feature, merged into `main`
  when ready. Delete after merge.

## Roadmap

- Image upload for items (currently auto-assigned from a curated library)
- Modifiers (size, add-ons) beyond the existing spice level
- Real backend: auth, multi-tenant data, order intake → kitchen pipeline
- Replace Tailwind CDN with a built CSS file before real production traffic
