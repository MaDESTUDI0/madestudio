const express = require('express');
const db = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

const KNOWN_PAGES = [
  'index', 'courses', 'atelier', 'gallery', 'shop', 'reviews', 'about', 'contacts',
  'login', 'register'
];

router.get('/pages', (_req, res) => {
  res.json({ pages: KNOWN_PAGES });
});

router.get('/content/:page', (req, res) => {
  const { page } = req.params;
  const rows = db.prepare('SELECT key, ru, kk FROM content WHERE page = ? ORDER BY key').all(page);
  const out = {};
  rows.forEach((row) => {
    out[row.key] = { ru: row.ru, kk: row.kk };
  });
  res.json(out);
});

router.put('/content/:page', requireRole('owner'), (req, res) => {
  const { page } = req.params;
  const body = req.body || {};

  const upsert = db.prepare(`
    INSERT INTO content (page, key, ru, kk, updated_at)
    VALUES (@page, @key, @ru, @kk, datetime('now'))
    ON CONFLICT(page, key) DO UPDATE SET
      ru = excluded.ru,
      kk = excluded.kk,
      updated_at = excluded.updated_at
  `);

  const entries = Object.entries(body);

  db.exec('BEGIN');
  try {
    entries.forEach(([key, val]) => {
      upsert.run({
        page,
        key,
        ru: (val && val.ru) || '',
        kk: (val && val.kk) || ''
      });
    });
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  res.json({ ok: true, updated: entries.length });
});

module.exports = router;
