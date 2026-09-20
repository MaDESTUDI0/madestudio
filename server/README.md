# MaDE Studio — backend + admin panel

Adds an editable-content layer on top of the static site in the repo
root: a small Express/SQLite server, a REST API, and an admin panel at
`/admin` for editing the RU/KK text of every page without touching code.

The public site (`index.html`, `courses.html`, …) keeps working exactly
as before on GitHub Pages even without this server running — it only
enhances the page with live-edited content when the API is reachable
(`js/content-loader.js`), and falls back to the text already baked
into the HTML otherwise.

## How it fits together

- `server/db.js` — SQLite database (`server/data/made.db`, created on
  first run) with two tables: `users` (owner/admin accounts) and
  `content` (one row per page + field, storing the RU and KK text).
- `server/scripts/seed-content.js` — already run once. It scanned all
  8 HTML pages, tagged every translatable element with a stable
  `data-key="…"` attribute, and loaded the current text into `content`.
  Safe to re-run after adding new `data-ru`/`data-kk` elements to the
  site — it only keys elements that don't have a `data-key` yet.
- `server/routes/content.js` — `GET /api/content/:page` (public) and
  `PUT /api/content/:page` (requires login) to read/write that page's
  fields.
- `server/routes/auth.js` — `POST /api/login`, `POST /api/logout`,
  `GET /api/me`, with basic rate-limiting on failed logins.
- `admin/` — the admin panel UI (plain HTML/CSS/JS, no build step).
- `js/content-loader.js` — runs on every public page, fetches
  `/api/content/<page>` and patches the live `data-ru`/`data-kk`
  values in before re-rendering, then gets out of the way if the API
  isn't reachable.

## Running locally

Requires **Node.js 22.5+** (uses the built-in `node:sqlite` module —
no native build step, no Python/compiler needed).

```
cd server
npm install
cp .env.example .env
# open .env and set SESSION_SECRET (a long random string):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run create-owner   # creates the first login (see below)
npm start               # http://localhost:4000
```

Open `http://localhost:4000` for the public site (served by the same
server) and `http://localhost:4000/admin` for the admin panel.

## Owner account

An owner account already exists in the local `server/data/made.db`
(created by `npm run create-owner`) — the username and generated
password were shared once, out of band, and are **not** written down
here because this repository is public. `server/data/made.db` is
git-ignored, so the account only exists on whatever machine/server
actually runs the backend; it was never committed.

If those credentials are lost, delete the `owner` row from the
`users` table and re-run `npm run create-owner` (optionally with
`OWNER_USERNAME` / `OWNER_PASSWORD` set in `.env` to choose your own,
instead of getting a random generated one). There's no self-service
password change yet — for now, resetting means re-running that script.

To add more admin accounts by hand for now, insert a row into `users`
with a bcrypt hash (`bcryptjs.hashSync(password, 12)`).

## Deploying

GitHub Pages only serves static files — it cannot run this server. To
get the admin panel live, deploy the `server/` folder to a Node host
(Render, Railway, Fly.io, a VPS — anything that runs `npm start` with
Node 22.5+), then:

1. Set real env vars there: `SESSION_SECRET`, `NODE_ENV=production`,
   `ALLOWED_ORIGIN=https://madestudi0.github.io`.
2. Run `npm run create-owner` once on that host (or copy
   `server/data/made.db` from local — it already has the owner account
   and all seeded content).
3. On the public site, if the API ends up on a different domain than
   the GitHub Pages site, add before `content-loader.js` on each page:
   ```html
   <script>window.MADE_API_BASE = 'https://your-api-domain.com';</script>
   ```
4. Point the admin panel's browser to `https://your-api-domain.com/admin`
   (or serve `admin/` from that same host, which is what `server.js`
   already does at `/admin`).

## Adding bonus accounts / SMS login later

The `users` table already exists and is separate from customer
accounts — a future bonus-system account table (phone number, SMS
code, balance) would live alongside it without touching what's built
here.
