const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const ALLOWED_CATEGORIES = ['made', 'student'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    cb(null, ALLOWED_MIME.includes(file.mimetype));
  }
});

// List (no image bytes — keeps this response small; the page fetches
// each photo separately via /api/gallery-photos/:id/image).
router.get('/gallery-photos', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, category, alt FROM gallery_photos ORDER BY id'
  );
  res.json(rows);
}));

router.get('/gallery-photos/:id/image', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT mime, data FROM gallery_photos WHERE id = $1',
    [req.params.id]
  );
  const photo = rows[0];
  if (!photo) return res.status(404).end();
  res.set('Content-Type', photo.mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(photo.data);
}));

router.post('/gallery-photos', requireRole('owner'), upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'missing_or_invalid_file' });
  }
  const category = req.body.category;
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'invalid_category' });
  }
  const alt = (req.body.alt || '').trim();

  const { rows } = await pool.query(
    'INSERT INTO gallery_photos (category, alt, mime, data) VALUES ($1, $2, $3, $4) RETURNING id, category, alt',
    [category, alt, req.file.mimetype, req.file.buffer]
  );
  res.json(rows[0]);
}));

router.delete('/gallery-photos/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM gallery_photos WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
