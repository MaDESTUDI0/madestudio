const express = require('express');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const KNOWN_PAGES = [
  'index', 'courses', 'atelier', 'gallery', 'shop', 'reviews', 'about', 'contacts',
  'login', 'register'
];

router.get('/pages', (_req, res) => {
  res.json({ pages: KNOWN_PAGES });
});

router.get('/content/:page', asyncHandler(async (req, res) => {
  const { page } = req.params;
  const { rows } = await pool.query('SELECT key, ru, kk FROM content WHERE page = $1 ORDER BY key', [page]);
  const out = {};
  rows.forEach((row) => {
    out[row.key] = { ru: row.ru, kk: row.kk };
  });
  res.json(out);
}));

router.put('/content/:page', requireRole('owner'), asyncHandler(async (req, res) => {
  const { page } = req.params;
  const body = req.body || {};
  const entries = Object.entries(body);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, val] of entries) {
      await client.query(
        `INSERT INTO content (page, key, ru, kk, updated_at)
         VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (page, key) DO UPDATE SET
           ru = EXCLUDED.ru,
           kk = EXCLUDED.kk,
           updated_at = EXCLUDED.updated_at`,
        [page, key, (val && val.ru) || '', (val && val.kk) || '']
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  res.json({ ok: true, updated: entries.length });
}));

module.exports = router;
