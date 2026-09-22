const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

// Customer: their own access state, used by cabinet.js to decide whether
// to show the curriculum, a "buy the course" prompt, or a "waiting for
// payment confirmation" message.
router.get('/course-access', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT course_access, course_requested_at FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = rows[0];
  res.json({
    access: Boolean(user && user.course_access),
    requested: Boolean(user && user.course_requested_at)
  });
}));

// Customer: record that they want to buy the course. Payment itself is
// still confirmed by hand (bank transfer / QR, same pattern as lekala
// orders) — this just puts them on the owner's list to follow up with.
router.post('/course-access/request', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT course_access, course_requested_at FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = rows[0];
  if (user && user.course_access) {
    return res.json({ access: true, requested: true });
  }
  if (!user || !user.course_requested_at) {
    await pool.query('UPDATE users SET course_requested_at = now() WHERE id = $1', [req.session.userId]);
  }
  res.json({ access: false, requested: true });
}));

// Owner: everyone who requested the course or already has access, so
// unpaid requests and already-granted students are both visible.
router.get('/course-access/requests', requireRole('owner'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, username AS email, name, course_access AS "courseAccess", course_requested_at AS "requestedAt"
     FROM users
     WHERE course_requested_at IS NOT NULL OR course_access = true
     ORDER BY course_requested_at DESC NULLS LAST, id DESC`
  );
  res.json(rows);
}));

// Owner: grant access once payment is confirmed.
router.post('/course-access/:userId/grant', requireRole('owner'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE users SET course_access = true WHERE id = $1 RETURNING id, username AS email, name, course_access AS "courseAccess", course_requested_at AS "requestedAt"',
    [req.params.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
}));

// Owner: revoke, in case access was granted by mistake.
router.post('/course-access/:userId/revoke', requireRole('owner'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'UPDATE users SET course_access = false WHERE id = $1 RETURNING id, username AS email, name, course_access AS "courseAccess", course_requested_at AS "requestedAt"',
    [req.params.userId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  res.json(rows[0]);
}));

module.exports = router;
