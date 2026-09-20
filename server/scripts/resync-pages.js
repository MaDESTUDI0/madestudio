/**
 * Force-resyncs content rows for specific pages from their current
 * HTML (overwrites DB values, unlike seed-content.js which only fills
 * in gaps). Use after editing markup for pages nobody has live-edited
 * via the admin panel yet.
 *
 * Usage: node scripts/resync-pages.js <page> [<page> ...]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { pool, migrate } = require('../db');

const ROOT = path.join(__dirname, '..', '..');
const pages = process.argv.slice(2);

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = re.exec(raw))) attrs[m[1]] = m[2];
  return attrs;
}

async function resyncPage(page) {
  const filePath = path.join(ROOT, `${page}.html`);
  const html = fs.readFileSync(filePath, 'utf8');
  const tagRe = /<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z][a-zA-Z0-9-]*(?:\s*=\s*"[^"]*")?)*)\s*\/?>/g;

  let count = 0;
  let m;
  while ((m = tagRe.exec(html))) {
    const attrs = parseAttrs(m[2]);
    if (attrs['data-ru'] !== undefined && attrs['data-key']) {
      await pool.query(
        `INSERT INTO content (page, key, ru, kk, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (page, key) DO UPDATE SET
           ru = EXCLUDED.ru,
           kk = EXCLUDED.kk,
           updated_at = EXCLUDED.updated_at`,
        [page, attrs['data-key'], attrs['data-ru'] || '', attrs['data-kk'] || '']
      );
      count += 1;
    }
  }
  console.log(`${page}.html: resynced ${count} fields.`);
}

async function main() {
  if (!pages.length) {
    console.error('Usage: node scripts/resync-pages.js <page> [<page> ...]');
    process.exitCode = 1;
    return;
  }
  await migrate();
  for (const page of pages) {
    await resyncPage(page);
  }
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
