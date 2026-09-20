const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');
const asyncHandler = require('../asyncHandler');
const { sendVerificationEmail } = require('../mailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

// Rate-limit login attempts per IP to slow down brute force
const attempts = new Map();
const MAX_ATTEMPTS_LOGIN = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS_LOGIN;
}

function registerFailure(ip) {
  const rec = attempts.get(ip);
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/login', asyncHandler(async (req, res) => {
  const ip = req.ip;
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    registerFailure(ip);
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  attempts.delete(ip);
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role;
  req.session.name = user.name;
  res.json({ ok: true, username: user.username, role: user.role, name: user.name });
}));

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.json({ username: req.session.username, role: req.session.role, name: req.session.name });
});

// Step 1: verify the current password, then either change immediately
// (accounts without a real email, e.g. the owner account) or email a
// 6-digit code that must be confirmed via /change-password/verify.
router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'weak_password' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  const newHash = bcrypt.hashSync(newPassword, 12);

  // No real email to send a code to (e.g. the owner account's username
  // is just "owner") — apply the change directly.
  if (!EMAIL_RE.test(user.username)) {
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    return res.json({ ok: true, immediate: true });
  }

  const { rows: pendingRows } = await pool.query(
    'SELECT * FROM pending_password_changes WHERE user_id = $1',
    [user.id]
  );
  const pending = pendingRows[0];
  if (pending && Date.now() - pending.last_sent_at.getTime() < RESEND_COOLDOWN_MS) {
    return res.status(429).json({ error: 'cooldown' });
  }

  const code = generateCode();
  const codeHash = bcrypt.hashSync(code, 10);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await pool.query(
    `INSERT INTO pending_password_changes (user_id, new_password_hash, code_hash, attempts, expires_at, last_sent_at)
     VALUES ($1, $2, $3, 0, $4, now())
     ON CONFLICT (user_id) DO UPDATE SET
       new_password_hash = EXCLUDED.new_password_hash,
       code_hash = EXCLUDED.code_hash,
       attempts = 0,
       expires_at = EXCLUDED.expires_at,
       last_sent_at = now()`,
    [user.id, newHash, codeHash, expiresAt]
  );

  try {
    await sendVerificationEmail(user.username, code);
  } catch (err) {
    console.error('Failed to send password-change verification email:', err.message);
    return res.status(502).json({ error: 'email_send_failed' });
  }

  res.json({ ok: true, requiresCode: true });
}));

// Step 2: confirm the code and apply the already-hashed new password.
router.post('/change-password/verify', requireAuth, asyncHandler(async (req, res) => {
  const { code } = req.body || {};
  if (!code) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const { rows } = await pool.query(
    'SELECT * FROM pending_password_changes WHERE user_id = $1',
    [req.session.userId]
  );
  const pending = rows[0];
  if (!pending) {
    return res.status(404).json({ error: 'no_pending_change' });
  }

  if (Date.now() > pending.expires_at.getTime()) {
    await pool.query('DELETE FROM pending_password_changes WHERE user_id = $1', [req.session.userId]);
    return res.status(410).json({ error: 'code_expired' });
  }

  if (pending.attempts >= MAX_ATTEMPTS) {
    await pool.query('DELETE FROM pending_password_changes WHERE user_id = $1', [req.session.userId]);
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  if (!bcrypt.compareSync(String(code), pending.code_hash)) {
    await pool.query(
      'UPDATE pending_password_changes SET attempts = attempts + 1 WHERE user_id = $1',
      [req.session.userId]
    );
    return res.status(401).json({ error: 'invalid_code' });
  }

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [pending.new_password_hash, req.session.userId]);
  await pool.query('DELETE FROM pending_password_changes WHERE user_id = $1', [req.session.userId]);

  res.json({ ok: true });
}));

module.exports = router;
