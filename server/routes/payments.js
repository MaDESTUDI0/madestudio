const express = require('express');
const asyncHandler = require('../asyncHandler');
const kaspi = require('../payment/kaspi');

const router = express.Router();

// Where Kaspi will call back once a payment succeeds/fails. Inert until
// KASPI_MERCHANT_ID/KASPI_API_KEY/KASPI_WEBHOOK_SECRET are set — real
// signature verification and order-status handling go in payment/kaspi.js,
// not here.
router.post('/payments/kaspi/webhook', asyncHandler(async (req, res) => {
  if (!kaspi.isConfigured) {
    return res.status(501).json({ error: 'kaspi_not_configured' });
  }
  // Real handling (verify signature, look up order by payment id, mark
  // paid idempotently, grant/deliver) gets implemented here once the
  // real Kaspi API is wired up in payment/kaspi.js.
  kaspi.verifyWebhook(req);
  res.json({ ok: true });
}));

module.exports = router;
