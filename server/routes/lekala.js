const express = require('express');
const { pool } = require('../db');
const { requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

router.get('/lekala-items', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT id, label FROM lekala_items ORDER BY id');
  res.json(rows);
}));

router.post('/lekala-items', requireRole('owner'), asyncHandler(async (req, res) => {
  const { label } = req.body || {};
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'missing_label' });
  }
  const { rows } = await pool.query(
    'INSERT INTO lekala_items (label) VALUES ($1) RETURNING id, label',
    [label.trim()]
  );
  res.json(rows[0]);
}));

router.delete('/lekala-items/:id', requireRole('owner'), asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM lekala_items WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
