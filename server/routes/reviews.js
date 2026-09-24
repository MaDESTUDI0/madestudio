const express = require('express');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.get('/reviews', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, author_name AS "authorName", course_label AS "courseLabel", text FROM reviews ORDER BY id DESC'
  );
  res.json(rows);
}));

function readFields(req) {
  const { authorName, courseLabel, text } = req.body || {};
  if (!authorName || !authorName.trim() || !text || !text.trim()) {
    return { error: { status: 400, body: { error: 'missing_fields' } } };
  }
  return {
    authorName: authorName.trim(),
    courseLabel: (courseLabel || '').trim(),
    text: text.trim()
  };
}

router.post('/reviews', requireRole('owner'), asyncHandler(async (req, res) => {
  const f = readFields(req);
  if (f.error) return res.status(f.error.status).json(f.error.body);

  const { rows } = await pool.query(
    `INSERT INTO reviews (author_name, course_label, text) VALUES ($1, $2, $3)
     RETURNING id, author_name AS "authorName", course_label AS "courseLabel", text`,
    [f.authorName, f.courseLabel, f.text]
  );
  res.json(rows[0]);
}));

router.put('/reviews/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  const f = readFields(req);
  if (f.error) return res.status(f.error.status).json(f.error.body);

  const { rows } = await pool.query(
    `UPDATE reviews SET author_name = $1, course_label = $2, text = $3 WHERE id = $4
     RETURNING id, author_name AS "authorName", course_label AS "courseLabel", text`,
    [f.authorName, f.courseLabel, f.text, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
}));

router.delete('/reviews/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
