# MaDE Studio — backend + admin panel

Adds an editable-content layer on top of the static site in the repo
root: a small Express/Postgres server, a REST API, and an admin panel
at `/admin` for editing the RU/KK text of every page without touching
code — plus real customer accounts with email-verified sign-up.

The public site (`index.html`, `courses.html`, …) keeps working exactly
as before on GitHub Pages even without this server running — it only
enhances the page with live-edited content when the API is reachable
(`js/content-loader.js`), and falls back to the text already baked
into the HTML otherwise.

## How it fits together

- `server/db.js` — Postgres connection pool + schema migration (runs
  automatically on startup). Three tables: `users` (owner/admin/customer
  accounts), `content` (one row per page + field, storing the RU and KK
  text), `pending_registrations` (unverified sign-ups awaiting an email
  code).
- `server/scripts/seed-content.js` — already run once. It scanned all
  8 marketing pages, tagged every translatable element with a stable
  `data-key="…"` attribute, and loaded the current text into `content`.
  Safe to re-run after adding new `data-ru`/`data-kk` elements — it
  only keys elements that don't have a `data-key` yet.
- `server/scripts/resync-pages.js <page> [<page> ...]` — force-overwrites
  DB content for specific pages from their current HTML. Use after
  editing markup on a page nobody has live-edited via the admin panel
  yet (seed-content.js won't touch already-keyed elements, so this is
  the one that actually refreshes stale DB text).
- `server/routes/content.js` — `GET /api/content/:page` (public) and
  `PUT /api/content/:page` (requires `role: owner`) to read/write a
  page's fields.
- `server/routes/auth.js` — `POST /api/login`, `POST /api/logout`,
  `GET /api/me`, with basic rate-limiting on failed logins.
- `admin/` — the admin panel UI (plain HTML/CSS/JS, no build step).
  Only accounts with `role = 'owner'` can log in here — the API
  rejects content edits from any other role with 403, and the admin
  UI itself checks the role after login and logs out anyone else.
- `js/content-loader.js` — runs on every public page, fetches
  `/api/content/<page>` and patches the live `data-ru`/`data-kk`
  values in before re-rendering, then gets out of the way if the API
  isn't reachable.
- `login.html` + `js/account.js` — the public-facing login page.
- `register.html` + `js/register.js` + `server/routes/register.js` +
  `server/mailer.js` — self-service sign-up: email + password →
  6-digit code emailed to that address → entering it creates the
  account (`role: 'customer'`) and logs the person in. Pending
  sign-ups live in `pending_registrations` (code bcrypt-hashed,
  10-minute expiry, capped at 5 wrong attempts, 60s resend cooldown)
  until verified, so nothing lands in `users` until the email is
  confirmed.

## Running locally

Requires **Node.js 18+** and a Postgres database to connect to (see
below for a free one on Render — you don't need Postgres installed
locally, just a `DATABASE_URL` to reach one).

```
cd server
npm install
cp .env.example .env
# open .env and set:
#  - DATABASE_URL (see below)
#  - SESSION_SECRET — a long random string:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run create-owner   # creates the first login (see below)
npm start               # http://localhost:4000
```

Open `http://localhost:4000` for the public site (served by the same
server) and `http://localhost:4000/admin` for the admin panel.

Registration works without any email setup: if `SMTP_HOST` /
`SMTP_USER` / `SMTP_PASS` are left blank in `.env`, the server prints
the 6-digit verification code to the console instead of emailing it —
useful for testing the flow locally. Fill those in with real SMTP
credentials (a Gmail app password, or a transactional provider like
Brevo/Mailgun/Resend) to actually send email.

## Deploying — Render (free tier)

GitHub Pages only serves static files — it cannot run this server. The
repo includes `render.yaml` (a Render "Blueprint") that provisions
both pieces in one go:

1. Push this repo to GitHub (already done) and go to
   [dashboard.render.com](https://dashboard.render.com) → **New** →
   **Blueprint** → pick this repo. Render reads `render.yaml` and sets
   up:
   - a **free Postgres database** (`made-studio-db`)
   - a **free web service** (`made-studio-api`) running `server/`,
     wired to that database automatically via `DATABASE_URL`
2. Render will ask you to fill in the env vars marked `sync: false`
   in `render.yaml` before the first deploy: `OWNER_PASSWORD` (pick
   one, 8+ chars — or leave blank and generate one later via the
   Shell tab) and the `SMTP_*` values if you want real email sent
   (leave blank for now — the code just logs to Render's console
   instead, same as local dev).
3. After the first deploy finishes, open the service's **Shell** tab
   (available even on the free plan) and run once:
   ```
   npm run create-owner
   ```
   This is a one-off command — it doesn't run automatically on deploy,
   so do it manually this one time. It picks up the `OWNER_USERNAME`
   / `OWNER_PASSWORD` env vars you set in step 2.
4. Copy the service's public URL (looks like
   `https://made-studio-api.onrender.com`). Give it to whoever's
   updating the front-end so `window.MADE_API_BASE` can be set to it
   on the public site (see below) — without that, the GitHub Pages
   site won't know where to find the API.
5. **Free-tier heads-up:** the web service spins down after ~15
   minutes with no traffic. The next visitor's first request (e.g.
   opening `/login.html` or the admin panel) takes 30–50 seconds while
   it wakes back up — normal, not a bug. The Postgres database itself
   does *not* get wiped by this (that only affects local disk, which
   this setup no longer uses — data lives in Postgres, not on the
   ephemeral filesystem). Upgrading the web service to a paid instance
   later removes the wake-up delay; nothing else about this setup
   needs to change to do that.

### Wiring the public site to the deployed API

Once you have the Render URL, add this line before `content-loader.js`
(and before `js/account.js` / `js/register.js` where present) on every
public page:

```html
<script>window.MADE_API_BASE = 'https://made-studio-api.onrender.com';</script>
```

And set `ALLOWED_ORIGIN` in the Render service's env vars to the
GitHub Pages origin (`https://madestudi0.github.io`) — already the
default in `render.yaml`, just confirm it matches.

## Owner account

Created via `npm run create-owner` (locally or in the Render Shell) —
the username/password are **not** written down here because this repo
is public. If lost, delete the `owner` row from `users` in the
database and re-run the script (optionally with `OWNER_USERNAME` /
`OWNER_PASSWORD` set in `.env` to choose your own instead of getting a
random generated one).

## Customer accounts

Self-service: `/register.html` → email + password → code emailed →
entering it creates the account and logs the person in. No owner
involvement needed.

For a second admin, or an account without going through email
verification:

```
npm run create-user <username> <password>            # role defaults to "customer"
npm run create-user <username> <password> owner       # a second admin
```

Customer accounts cannot reach `/admin` or edit content — only
`role: "owner"` can (enforced both in the API and in the admin UI).

## Adding a bonus system / SMS login later

Customer accounts already exist (`users`, `role = 'customer'`). A
future bonus system would add a `balance` column (or a separate
`bonus_ledger` table) tied to `users.id`, and phone+SMS login would
replace/extend the username+password flow in `routes/auth.js` without
touching the content/admin pieces built here.
