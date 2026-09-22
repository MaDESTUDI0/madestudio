const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const MODULE_KEYS = ['m1', 'm2', 'm3', 'm4'];
const PRODUCT_TYPES = ['file', 'course_module', 'course_full'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// Public list: price + whether a file is attached (hasFile), never
// the file bytes themselves — those only ever leave the server as an
// email attachment once an order is confirmed paid. Also carries
// productType/moduleKey so the storefront knows where to show each
// item (shop.html for 'file', courses.html for the course types).
router.get('/lekala-items', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, label, price, product_type AS "productType", module_key AS "moduleKey",
            (file_data IS NOT NULL) AS "hasFile"
     FROM lekala_items ORDER BY id`
  );
  res.json(rows);
}));

router.post('/lekala-items', requireRole('owner'), upload.single('file'), asyncHandler(async (req, res) => {
  const { label, price, productType, moduleKey } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'missing_label' });
  }
  const priceValue = price ? Number(price) : null;
  if (price && !(priceValue >= 0)) {
    return res.status(400).json({ error: 'invalid_price' });
  }

  const type = PRODUCT_TYPES.includes(productType) ? productType : 'file';
  let module = null;
  if (type === 'course_module') {
    if (!MODULE_KEYS.includes(moduleKey)) {
      return res.status(400).json({ error: 'invalid_module' });
    }
    module = moduleKey;
  }

  const file = req.file;
  const { rows } = await pool.query(
    `INSERT INTO lekala_items (label, price, file_name, file_mime, file_data, product_type, module_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, label, price, product_type AS "productType", module_key AS "moduleKey", (file_data IS NOT NULL) AS "hasFile"`,
    [label.trim(), priceValue, file ? file.originalname : null, file ? file.mimetype : null, file ? file.buffer : null, type, module]
  );
  res.json(rows[0]);
}));

router.delete('/lekala-items/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM lekala_items WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
module.exports.MODULE_KEYS = MODULE_KEYS;
