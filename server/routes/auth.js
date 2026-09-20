const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// Rate-limit login attempts per IP to slow down brute force
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function registerFailure(ip) {
  const rec = attempts.get(ip);
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
}

router.post('/login', (req, res) => {
  const ip = req.ip;
  if (tooManyAttempts(ip)) {
    return res.status(429).json({ error: 'too_many_attempts' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'missing_credentials' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    registerFailure(ip);
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  attempts.delete(ip);
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ ok: true, username: user.username });
});

router.post('/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  res.json({ username: req.session.username });
});

module.exports = router;
