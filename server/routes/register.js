const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { sendVerificationEmail } = require('../mailer');

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

router.post('/register/start', async (req, res) => {
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

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ error: 'already_registered' });
  }

  const pending = db.prepare('SELECT * FROM pending_registrations WHERE email = ?').get(normalizedEmail);
  if (pending && Date.now() - Date.parse(pending.last_sent_at + 'Z') < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'cooldown' });
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);
  const passwordHash = bcrypt.hashSync(password, 12);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  db.prepare(`
    INSERT INTO pending_registrations (email, password_hash, code_hash, attempts, expires_at, last_sent_at)
    VALUES (@email, @password_hash, @code_hash, 0, @expires_at, datetime('now'))
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      code_hash = excluded.code_hash,
      attempts = 0,
      expires_at = excluded.expires_at,
      last_sent_at = datetime('now')
  `).run({ email: normalizedEmail, password_hash: passwordHash, code_hash: codeHash, expires_at: expiresAt });

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
    return res.status(502).json({ error: 'email_send_failed' });
  }

  res.json({ ok: true });
});

router.post('/register/resend', async (req, res) => {
  const { email } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const pending = db.prepare('SELECT * FROM pending_registrations WHERE email = ?').get(normalizedEmail);
  if (!pending) {
    return res.status(404).json({ error: 'no_pending_registration' });
  }
  if (Date.now() - Date.parse(pending.last_sent_at + 'Z') < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'cooldown' });
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();

  db.prepare(`
    UPDATE pending_registrations
    SET code_hash = @code_hash, attempts = 0, expires_at = @expires_at, last_sent_at = datetime('now')
    WHERE email = @email
  `).run({ email: normalizedEmail, code_hash: codeHash, expires_at: expiresAt });

  try {
    await sendVerificationEmail(normalizedEmail, code);
  } catch (err) {
    console.error('Failed to resend verification email:', err.message);
    return res.status(502).json({ error: 'email_send_failed' });
  }

  res.json({ ok: true });
});

router.post('/register/verify', (req, res) => {
  const ip = req.ip;
  if (tooManyFromIp(ip)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();

  const pending = db.prepare('SELECT * FROM pending_registrations WHERE email = ?').get(normalizedEmail);
  if (!pending) {
    return res.status(404).json({ error: 'no_pending_registration' });
  }

  if (Date.now() > Date.parse(pending.expires_at + 'Z')) {
    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(normalizedEmail);
    return res.status(410).json({ error: 'code_expired' });
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(normalizedEmail);
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  if (!bcrypt.compareSync(String(code), pending.code_hash)) {
    registerIpHit(ip);
    db.prepare('UPDATE pending_registrations SET attempts = attempts + 1 WHERE email = ?').run(normalizedEmail);
    return res.status(401).json({ error: 'invalid_code' });
  }

  // Code correct — create the account and log the user in.
  const insert = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
  let userId;
  try {
    const result = insert.run(normalizedEmail, pending.password_hash, 'customer');
    userId = result.lastInsertRowid;
  } catch (err) {
    // Extremely unlikely race: account created between start() and verify().
    return res.status(409).json({ error: 'already_registered' });
  }

  db.prepare('DELETE FROM pending_registrations WHERE email = ?').run(normalizedEmail);

  req.session.userId = userId;
  req.session.username = normalizedEmail;
  req.session.role = 'customer';

  res.json({ ok: true, username: normalizedEmail, role: 'customer' });
});

module.exports = router;
