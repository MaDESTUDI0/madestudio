/**
 * One-time (idempotent) migration:
 *  1. Scans each page's HTML for elements carrying data-ru/data-kk.
 *  2. Assigns each one a stable, readable key based on its section.
 *  3. Injects data-key="..." into the HTML source (skips elements that
 *     already have one, so this is safe to re-run).
 *  4. Upserts the current RU/KK text into the content table, so the
 *     admin panel edits the exact copy already live on the site.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool, migrate } = require('../db');

const ROOT = path.join(__dirname, '..', '..');
const PAGES = ['index', 'courses', 'atelier', 'gallery', 'shop', 'reviews', 'about', 'contacts', 'login', 'register'];

const LANDMARK_RULES = [
  [/\bpage-hero\b/, 'page-hero'],
  [/\bhero-grid\b/, 'hero'],
  [/\bdirections-grid\b/, 'directions'],
  [/\bcol-3\b/, 'columns'],
  [/\benroll-grid\b/, 'enroll'],
  [/\bgallery-grid\b/, 'gallery'],
  [/\bproduct-grid\b/, 'shop'],
  [/\brule-list\b/, 'program'],
  [/\bcontact-grid\b/, 'contacts'],
  [/\bempty-state\b/, 'empty'],
  [/\bsplit\b/, 'intro'],
  [/\bnav-links\b/, 'nav'],
  [/\bfooter-links\b|\bfooter-row\b/, 'footer']
];

function slugFirstClass(classValue) {
  const first = (classValue || '').trim().split(/\s+/)[0] || 'section';
  return first.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'section';
}

function landmarkFor(tagName, id, classValue) {
  if (id === 'mobileNav') return 'mobile-nav';
  for (const [re, name] of LANDMARK_RULES) {
    if (re.test(classValue || '')) return name;
  }
  if (tagName === 'section') return slugFirstClass(classValue);
  if (tagName === 'footer') return 'footer';
  return null; // no change
}

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(raw))) {
    attrs[m[1]] = m[2];
  }
  attrs._hasI18nHtml = /\bdata-i18n-html\b(?!\s*=)/.test(raw);
  return attrs;
}

async function processPage(pageName) {
  const filePath = path.join(ROOT, `${pageName}.html`);
  let html = fs.readFileSync(filePath, 'utf8');

  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:\s*=\s*"[^"]*")?)*)\s*\/?>/g;

  let landmark = 'page';
  const counters = {};
  const found = []; // { start, tagEnd, tagName, attrs, key }
  let m;

  while ((m = tagRe.exec(html))) {
    const tagName = m[1].toLowerCase();
    const attrsRaw = m[2];
    const attrs = parseAttrs(attrsRaw);

    const lm = landmarkFor(tagName, attrs.id, attrs.class);
    if (lm) landmark = lm;

    if (attrs['data-ru'] !== undefined) {
      if (attrs['data-key']) continue; // already keyed, leave as-is (re-run safe)
      counters[landmark] = (counters[landmark] || 0) + 1;
      const key = `${landmark}.${counters[landmark]}`;
      found.push({
        start: m.index,
        tagNameLength: tagName.length,
        ru: attrs['data-ru'] || '',
        kk: attrs['data-kk'] || '',
        key
      });
    }
  }

  // Inject data-key from the end of the file backwards so earlier offsets stay valid.
  for (let i = found.length - 1; i >= 0; i--) {
    const f = found[i];
    const insertAt = f.start + 1 + f.tagNameLength; // right after "<tagname"
    html = html.slice(0, insertAt) + ` data-key="${f.key}"` + html.slice(insertAt);
  }

  fs.writeFileSync(filePath, html, 'utf8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const f of found) {
      await client.query(
        `INSERT INTO content (page, key, ru, kk, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (page, key) DO NOTHING`,
        [pageName, f.key, f.ru, f.kk]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  console.log(`${pageName}.html: ${found.length} fields keyed and seeded.`);
}

async function main() {
  await migrate();
  for (const page of PAGES) {
    await processPage(page);
  }
  console.log('Done.');
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
