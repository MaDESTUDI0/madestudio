const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

// Customer: which modules they currently have access to. Buying
// happens through the normal cart/order flow on courses.html, and
// access is only ever granted server-side once a payment is confirmed
// (currently: nowhere yet — that only happens via the Kaspi webhook
// once it's real; see routes/orders.js and payment/kaspi.js).
router.get('/course-access', requireAuth, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT module_key FROM user_module_access WHERE user_id = $1',
    [req.session.userId]
  );
  res.json({ modules: rows.map((r) => r.module_key) });
}));

// Owner: everyone who has been granted at least one module — read-only
// visibility, no manual grant action (access only comes from a paid order).
router.get('/course-access/all', requireRole('owner'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT users.id, users.username AS email, users.name,
            COALESCE(array_agg(uma.module_key) FILTER (WHERE uma.module_key IS NOT NULL), '{}') AS modules
     FROM users
     JOIN user_module_access uma ON uma.user_id = users.id
     GROUP BY users.id, users.username, users.name
     ORDER BY users.id DESC`
  );
  res.json(rows);
}));

module.exports = router;
