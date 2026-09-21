const express = require('express');
const { pool } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');
const { sendOrderFiles } = require('../mailer');

const router = express.Router();

// Customer: place an order for one or more lekala items. Price/label
// are snapshotted onto order_items so a later price change or
// deletion of the source item doesn't rewrite past orders.
router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const itemIds = Array.isArray(req.body && req.body.itemIds) ? req.body.itemIds : [];
  if (!itemIds.length) {
    return res.status(400).json({ error: 'empty_cart' });
  }

  const { rows: items } = await pool.query(
    'SELECT id, label, price FROM lekala_items WHERE id = ANY($1::int[])',
    [itemIds]
  );
  if (!items.length) {
    return res.status(400).json({ error: 'items_not_found' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: orderRows } = await client.query(
      'INSERT INTO orders (user_id, status) VALUES ($1, $2) RETURNING id, status, created_at',
      [req.session.userId, 'pending']
    );
    const order = orderRows[0];

    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, lekala_item_id, label, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.id, item.label, item.price]
      );
    }
    await client.query('COMMIT');

    res.json({
      id: order.id,
      status: order.status,
      items: items.map((item) => ({ label: item.label, price: item.price }))
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Customer: their own order history.
router.get('/orders/mine', requireAuth, asyncHandler(async (req, res) => {
  const { rows: orders } = await pool.query(
    'SELECT id, status, created_at, confirmed_at FROM orders WHERE user_id = $1 ORDER BY id DESC',
    [req.session.userId]
  );
  const { rows: items } = await pool.query(
    `SELECT order_id, label, price FROM order_items
     WHERE order_id = ANY($1::int[]) ORDER BY id`,
    [orders.map((o) => o.id)]
  );
  const byOrder = {};
  items.forEach((item) => {
    (byOrder[item.order_id] = byOrder[item.order_id] || []).push({ label: item.label, price: item.price });
  });
  res.json(orders.map((order) => ({ ...order, items: byOrder[order.id] || [] })));
}));

// Owner: every order, newest first, with the customer's contact info.
router.get('/orders', requireRole('owner'), asyncHandler(async (req, res) => {
  const { rows: orders } = await pool.query(
    `SELECT orders.id, orders.status, orders.created_at, orders.confirmed_at,
            users.username AS email, users.name
     FROM orders
     JOIN users ON users.id = orders.user_id
     ORDER BY orders.id DESC`
  );
  const { rows: items } = await pool.query(
    `SELECT order_id, label, price FROM order_items
     WHERE order_id = ANY($1::int[]) ORDER BY id`,
    [orders.map((o) => o.id)]
  );
  const byOrder = {};
  items.forEach((item) => {
    (byOrder[item.order_id] = byOrder[item.order_id] || []).push({ label: item.label, price: item.price });
  });
  res.json(orders.map((order) => ({ ...order, items: byOrder[order.id] || [] })));
}));

// Owner: mark an order paid and email the buyer their files. This is
// the "automatic delivery" step — payment itself is still confirmed
// by hand (bank transfer / QR, no payment gateway wired up), but
// once you click this, sending the files is instant and automatic.
router.post('/orders/:id/confirm', requireRole('owner'), asyncHandler(async (req, res) => {
  const { rows: orderRows } = await pool.query(
    `SELECT orders.id, orders.status, users.username AS email, users.name
     FROM orders JOIN users ON users.id = orders.user_id
     WHERE orders.id = $1`,
    [req.params.id]
  );
  const order = orderRows[0];
  if (!order) return res.status(404).json({ error: 'not_found' });
  if (order.status === 'paid') return res.status(409).json({ error: 'already_confirmed' });

  const { rows: items } = await pool.query(
    `SELECT order_items.label, lekala_items.file_name AS "fileName",
            lekala_items.file_mime AS "fileMime", lekala_items.file_data AS "fileData"
     FROM order_items
     LEFT JOIN lekala_items ON lekala_items.id = order_items.lekala_item_id
     WHERE order_items.order_id = $1
     ORDER BY order_items.id`,
    [order.id]
  );

  await sendOrderFiles(order.email, order.name, items);

  const { rows: updated } = await pool.query(
    "UPDATE orders SET status = 'paid', confirmed_at = now() WHERE id = $1 RETURNING id, status, confirmed_at",
    [order.id]
  );
  res.json(updated[0]);
}));

module.exports = router;
