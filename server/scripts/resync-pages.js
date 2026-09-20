/**
 * Force-resyncs content rows for specific pages from their current
 * HTML (overwrites DB values, unlike seed-content.js which only fills
 * in gaps). Use after editing markup for pages nobody has live-edited
 * via the admin panel yet.
 *
 * Usage: node scripts/resync-pages.js <page> [<page> ...]
 */
const fs = require('fs');
const path = require('path');
const db = require('../db');

const ROOT = path.join(__dirname, '..', '..');
const pages = process.argv.slice(2);

if (!pages.length) {
  console.error('Usage: node scripts/resync-pages.js <page> [<page> ...]');
  process.exit(1);
}

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(raw))) attrs[m[1]] = m[2];
  return attrs;
}

const upsert = db.prepare(`
  INSERT INTO content (page, key, ru, kk, updated_at)
  VALUES (@page, @key, @ru, @kk, datetime('now'))
  ON CONFLICT(page, key) DO UPDATE SET
    ru = excluded.ru,
    kk = excluded.kk,
    updated_at = excluded.updated_at
`);

pages.forEach((page) => {
  const filePath = path.join(ROOT, `${page}.html`);
  const html = fs.readFileSync(filePath, 'utf8');
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:\s*=\s*"[^"]*")?)*)\s*\/?>/g;

  let count = 0;
  let m;
  while ((m = tagRe.exec(html))) {
    const attrs = parseAttrs(m[2]);
    if (attrs['data-ru'] !== undefined && attrs['data-key']) {
      upsert.run({
        page,
        key: attrs['data-key'],
        ru: attrs['data-ru'] || '',
        kk: attrs['data-kk'] || ''
      });
      count += 1;
    }
  }
  console.log(`${page}.html: resynced ${count} fields.`);
});
