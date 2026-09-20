const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { sendVerificationEmail } = require('../mailer');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// Per-IP throttling, same pattern as login.
const ipAttempts = new Map();
const MAX_IP_ATTEMPTS = 10;
const IP_WINDOW_MS = 15 * 60 * 1000;

function tooManyFromIp(ip) {
  const rec = ipAttempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > IP_WINDOW_MS) {
    ipAttempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_IP_ATTEMPTS;
}

function registerIpHit(ip) {
  const rec = ipAttempts.get(ip);
  if (!rec || Date.now() - rec.first > IP_WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/register/start', asyncHandler(async (req, res) => {
  const ip = req.ip;
  if (tooManyFromIp(ip)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }
  registerIpHit(ip);

  const { email, password } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'weak_password' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const { rows: existingRows } = await pool.query('SELECT id FROM users WHERE username = $1', [normalizedEmail]);
  if (existingRows[0]) {
    return res.status(409).json({ error: 'already_registered' });
  }

  const { rows: pendingRows } = await pool.query(
    'SELECT * FROM pending_registrations WHERE email = $1',
    [normalizedEmail]
  );
  const pending = pendingRows[0];
  if (pending && Date.now() - pending.last_sent_at.getTime() < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'cooldown' });
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);
  const passwordHash = bcrypt.hashSync(password, 12);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await pool.query(
    `INSERT INTO pending_registrations (email, password_hash, code_hash, attempts, expires_at, last_sent_at)
     VALUES ($1, $2, $3, 0, $4, now())
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       code_hash = EXCLUDED.code_hash,
       attempts = 0,
       expires_at = EXCLUDED.expires_at,
       last_sent_at = now()`,
    [normalizedEmail, passwordHash, codeHash, expiresAt]
  );

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
    return res.status(502).json({ error: 'email_send_failed' });
  }

  res.json({ ok: true });
}));

router.post('/register/resend', asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const { rows } = await pool.query('SELECT * FROM pending_registrations WHERE email = $1', [normalizedEmail]);
  const pending = rows[0];
  if (!pending) {
    return res.status(404).json({ error: 'no_pending_registration' });
  }
  if (Date.now() - pending.last_sent_at.getTime() < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'cooldown' });
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await pool.query(
    `UPDATE pending_registrations
     SET code_hash = $2, attempts = 0, expires_at = $3, last_sent_at = now()
     WHERE email = $1`,
    [normalizedEmail, codeHash, expiresAt]
  );

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (err) {
    console.error('Failed to resend verification email:', err.message);
    return res.status(502).json({ error: 'email_send_failed' });
  }

  res.json({ ok: true });
}));

router.post('/register/verify', asyncHandler(async (req, res) => {
  const ip = req.ip;
  if (tooManyFromIp(ip)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const { rows } = await pool.query('SELECT * FROM pending_registrations WHERE email = $1', [normalizedEmail]);
  const pending = rows[0];
  if (!pending) {
    return res.status(404).json({ error: 'no_pending_registration' });
  }

  if (Date.now() > pending.expires_at.getTime()) {
    await pool.query('DELETE FROM pending_registrations WHERE email = $1', [normalizedEmail]);
    return res.status(410).json({ error: 'code_expired' });
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await pool.query('DELETE FROM pending_registrations WHERE email = $1', [normalizedEmail]);
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  if (!bcrypt.compareSync(String(code), pending.code_hash)) {
    registerIpHit(ip);
    await pool.query('UPDATE pending_registrations SET attempts = attempts + 1 WHERE email = $1', [normalizedEmail]);
    return res.status(401).json({ error: 'invalid_code' });
  }

  // Code correct — create the account and log the user in.
  let userId;
  try {
    const { rows: inserted } = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id',
      [normalizedEmail, pending.password_hash, 'customer']
    );
    userId = inserted[0].id;
  } catch (err) {
    // Extremely unlikely race: account created between start() and verify().
    return res.status(409).json({ error: 'already_registered' });
  }

  await pool.query('DELETE FROM pending_registrations WHERE email = $1', [normalizedEmail]);

  req.session.userId = userId;
  req.session.username = normalizedEmail;
  req.session.role = 'customer';

  res.json({ ok: true, username: normalizedEmail, role: 'customer' });
}));

module.exports = router;
