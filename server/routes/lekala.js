const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Public list: price + whether a file is attached (hasFile), never
// the file bytes themselves — those only ever leave the server as an
// email attachment once an order is confirmed paid.
router.get('/lekala-items', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, label, price, (file_data IS NOT NULL) AS "hasFile" FROM lekala_items ORDER BY id'
  );
  res.json(rows);
}));

router.post('/lekala-items', requireRole('owner'), upload.single('file'), asyncHandler(async (req, res) => {
  const { label, price } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'missing_label' });
  }
  const priceValue = price ? Number(price) : null;
  if (price && !(priceValue >= 0)) {
    return res.status(400).json({ error: 'invalid_price' });
  }

  const file = req.file;
  const { rows } = await pool.query(
    `INSERT INTO lekala_items (label, price, file_name, file_mime, file_data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, label, price, (file_data IS NOT NULL) AS "hasFile"`,
    [label.trim(), priceValue, file ? file.originalname : null, file ? file.mimetype : null, file ? file.buffer : null]
  );
  res.json(rows[0]);
}));

router.delete('/lekala-items/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM lekala_items WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
