const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const MODULE_KEYS = ['m1', 'm2', 'm3', 'm4'];
const PRODUCT_TYPES = ['file', 'course_module', 'course_full'];
// The offline-* slugs don't bind to a shop.html card like the others —
// they let the owner set the offline course/module prices shown as
// plain text on courses.html (no cart there, enrollment stays
// WhatsApp) without editing the page's source each time.
const SLUGS = ['sewing-book', 'planner', 'offline-full', 'offline-m2', 'offline-m3', 'offline-m4'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});
const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

// Public list: price + whether a file/photo is attached, never the
// bytes themselves — the downloadable file only ever leaves the
// server as an email attachment once an order is confirmed paid, and
// the display photo is fetched separately via :id/image (keeps this
// list light). Carries productType/moduleKey/slug so the storefront
// knows where to show each item: a fixed shop.html card if slug is
// set, its own full photo card if it has an image, otherwise the
// plain-text "Наборы лекал" list for 'file', or courses.html for the
// course types.
router.get('/lekala-items', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, label, price, description, product_type AS "productType", module_key AS "moduleKey", slug,
            (file_data IS NOT NULL) AS "hasFile", (image_data IS NOT NULL) AS "hasImage"
     FROM lekala_items ORDER BY id`
  );
  res.json(rows);
}));

router.get('/lekala-items/:id/image', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT image_mime, image_data FROM lekala_items WHERE id = $1',
    [req.params.id]
  );
  const item = rows[0];
  if (!item || !item.image_data) return res.status(404).end();
  res.set('Content-Type', item.image_mime);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(item.image_data);
}));

// Shared by POST (create) and PUT (edit) — validates the plain fields
// and picks out the optional file/image uploads multer parsed.
function readItemFields(req) {
  const { label, price, description, productType, moduleKey, slug } = req.body || {};
  if (!label || !label.trim()) {
    return { error: { status: 400, body: { error: 'missing_label' } } };
  }
  const priceValue = price ? Number(price) : null;
  if (price && !(priceValue >= 0)) {
    return { error: { status: 400, body: { error: 'invalid_price' } } };
  }

  const type = PRODUCT_TYPES.includes(productType) ? productType : 'file';
  let module = null;
  if (type === 'course_module') {
    if (!MODULE_KEYS.includes(moduleKey)) {
      return { error: { status: 400, body: { error: 'invalid_module' } } };
    }
    module = moduleKey;
  }
  let slugValue = null;
  if (type === 'file' && slug) {
    if (!SLUGS.includes(slug)) {
      return { error: { status: 400, body: { error: 'invalid_slug' } } };
    }
    slugValue = slug;
  }

  const files = req.files || {};
  const file = files.file && files.file[0];
  const image = files.image && files.image[0];
  if (image && !IMAGE_MIME.includes(image.mimetype)) {
    return { error: { status: 400, body: { error: 'invalid_image' } } };
  }

  return {
    label: label.trim(),
    price: priceValue,
    description: description ? description.trim() : null,
    type,
    module,
    slug: slugValue,
    file,
    image
  };
}

const RETURNING = `id, label, price, description, product_type AS "productType", module_key AS "moduleKey", slug,
            (file_data IS NOT NULL) AS "hasFile", (image_data IS NOT NULL) AS "hasImage"`;

router.post('/lekala-items', requireRole('owner'), uploadFields, asyncHandler(async (req, res) => {
  const f = readItemFields(req);
  if (f.error) return res.status(f.error.status).json(f.error.body);

  const { rows } = await pool.query(
    `INSERT INTO lekala_items
       (label, price, description, file_name, file_mime, file_data, image_mime, image_data, product_type, module_key, slug)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${RETURNING}`,
    [f.label, f.price, f.description,
     f.file ? f.file.originalname : null, f.file ? f.file.mimetype : null, f.file ? f.file.buffer : null,
     f.image ? f.image.mimetype : null, f.image ? f.image.buffer : null,
     f.type, f.module, f.slug]
  );
  res.json(rows[0]);
}));

// Edits an existing item in place — label, price, description, type
// and (optionally) a replacement file/photo. Anything not part of
// this request (e.g. the file, if only the price changed) is left as
// it was via COALESCE, so the owner doesn't have to re-upload a photo
// just to fix a typo in the price.
router.put('/lekala-items/:id', requireRole('owner'), uploadFields, asyncHandler(async (req, res) => {
  const f = readItemFields(req);
  if (f.error) return res.status(f.error.status).json(f.error.body);

  const { rows } = await pool.query(
    `UPDATE lekala_items SET
       label = $1, price = $2, description = $3,
       file_name = COALESCE($4, file_name), file_mime = COALESCE($5, file_mime), file_data = COALESCE($6, file_data),
       image_mime = COALESCE($7, image_mime), image_data = COALESCE($8, image_data),
       product_type = $9, module_key = $10, slug = $11
     WHERE id = $12
     RETURNING ${RETURNING}`,
    [f.label, f.price, f.description,
     f.file ? f.file.originalname : null, f.file ? f.file.mimetype : null, f.file ? f.file.buffer : null,
     f.image ? f.image.mimetype : null, f.image ? f.image.buffer : null,
     f.type, f.module, f.slug, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
}));

router.delete('/lekala-items/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM lekala_items WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
module.exports.MODULE_KEYS = MODULE_KEYS;
