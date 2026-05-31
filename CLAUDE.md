# Benu Project Guide

## What This Is
Benu (also called Better Menu) turns a restaurant menu into a website, QR ordering, and a live kitchen display. The live product is plain HTML, CSS, and JavaScript. There is no build step.

## What Actually Deploys (Read First)
- The live site is the plain `.html` files in the project root: `index.html`, `onboard.html`, `menu.html`, `builder.html`, `kitchen.html`, `resend.html`.
- Vercel serves these files directly. Editing them changes the live site.
- Do not work in the `app/` folder or `.next/`. That is an unused Next.js experiment and is not deployed. Ignore it.
- Live URL: https://better-menu-eight.vercel.app/

## How Work Gets Saved
- Local branch `main` pushes to the `static-html-version` branch on GitHub. A plain `git push` works.
- Always commit and push after making changes. Do not wait to be asked.
- Before every push, run `git pull --rebase` first. This stops parallel sessions from overwriting each other.
- Use short, clear commit messages.

## How The Live Site Updates
- A `git push` to `static-html-version` now auto-deploys via GitHub Actions (`.github/workflows/deploy.yml`). Live at https://better-menu-eight.vercel.app about 1 to 2 minutes after the push.
- It uses the repo secret `VERCEL_TOKEN` (already set). Watch a run with `gh run watch` or the Actions tab.
- Do not rely on Vercel's own dashboard Git integration. It points at the wrong repo, so only this Action publishes the site.
- Manual fallback if ever needed: `npx vercel --prod --yes` from the project root. The Vercel CLI is signed in.
- Always verify by loading the URL after a deploy.

## Running Multiple Sessions (Parallel-Safe)
The onboarding is split into one file per screen so many sessions never touch the same file. Give each session exactly ONE file.

Onboarding file map (in `js/onboard/`):
- Screens: `screen-import.js`, `screen-build.js`, `screen-generate.js`, `screen-review.js`, `screen-photos.js`, `screen-catering.js`, `screen-locations.js`, `screen-templates.js`, `screen-publish.js`, `screen-allergy.js`.
- Shared: `icons.js` (icon set), `data.js` (sample data and copy), `state.js` (app state), `chrome.js` (header, footer, page head), `app.js` (router, events, boot).
- `onboard.html` is just the shell, the CSS, and the script tags. The other root files (`index.html`, `menu.html`, etc.) are still single files, so one session each.

Best way, full isolation, good for 10+ at once:
1. `bash scripts/session-start.sh <name>` makes an isolated copy at `../benu-<name>` on its own branch.
2. Open that session in that folder and edit its one file.
3. `bash scripts/session-ship.sh "what changed"` publishes it live. It retries automatically if other sessions ship at the same moment.

Simple way, shared folder: edit your one file, then `git pull --rebase` and `git push`. Because each session owns a different file, these merge cleanly.

Hard rule: never edit the same file in two sessions at once. If a push is rejected, run `git pull --rebase`, resolve any conflict, then push again.

## Writing Rules (Strict)
- Never use em-dashes anywhere. Use a comma, a period, or a colon instead.
- Titles use Title Case. Capitalize the first letter of every word.
- Keep copy punchy and bold. Short, strong sentences. Lead with the benefit.

## Visual Consistency (Strict)
Match the existing styles in `index.html`. Treat it as the source of truth.
- One title style for all titles. One subtitle style for all subtitles. Do not change sizes per section.
- One button size and style for all buttons. Reuse the same class instead of making new ones.
- When adding anything new, copy an existing element's styling rather than inventing new values.

Design tokens already defined in `index.html`:
- Background `#FAFBF7` (warm cream). Surface `#FFFFFF`. Raised `#F2F6EB`.
- Text `#14171A`. Muted text `#6B7269`.
- Accent is mint green (`--accent`, deep `#213116`, soft pill `#CBE0A8`).
- Fonts: Cormorant Garamond (serif, for display headings), Inter (sans, for body and UI), JetBrains Mono (mono, for small labels).
- Use the existing `--shadow-*` tokens for shadows. Do not hand roll new ones.

## Tech Stack
- Frontend: plain HTML, CSS, and JavaScript in the root files plus `js/`, `assets/`, and `components/`.
- Backend helpers: Supabase, Resend (email), pdf-lib (PDF), qrcode (QR codes).
