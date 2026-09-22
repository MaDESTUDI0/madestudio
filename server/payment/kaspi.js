/**
 * Kaspi payment provider — placeholder.
 *
 * No real Kaspi merchant/API integration exists yet (only a personal
 * pay.kaspi.kz payment link, which has no programmatic confirmation).
 * This file is the one place that changes once real credentials and
 * API docs are available — nothing else in the codebase should talk
 * to Kaspi directly.
 *
 * Expected env vars once configured (never hardcode real values):
 *   KASPI_MERCHANT_ID
 *   KASPI_API_KEY
 *   KASPI_WEBHOOK_SECRET   (to verify incoming webhook signatures)
 */

const configured = Boolean(process.env.KASPI_MERCHANT_ID && process.env.KASPI_API_KEY);

/**
 * Creates a payment for an order and returns where to send the buyer.
 * Not implemented until real Kaspi API credentials + docs are wired in.
 */
async function createPayment(/* order */) {
  throw new Error('Kaspi API is not configured yet');
}

/**
 * Verifies an inbound webhook/callback really came from Kaspi (signature
 * check against KASPI_WEBHOOK_SECRET) and extracts the payment result.
 * Not implemented until real Kaspi API credentials + docs are wired in.
 */
function verifyWebhook(/* req */) {
  throw new Error('Kaspi API is not configured yet');
}

module.exports = { isConfigured: configured, createPayment, verifyWebhook };
