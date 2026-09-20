require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');

function randomPassword(len = 16) {
  return crypto.randomBytes(len).toString('base64url').slice(0, len);
}

function createOwner() {
  const username = process.env.OWNER_USERNAME || 'owner';
  let password = process.env.OWNER_PASSWORD;
  let generated = false;

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    console.log(`Owner account "${username}" already exists — skipping.`);
    console.log('To reset the password, delete the user from server/data/made.db or set a new OWNER_PASSWORD and re-run with --force.');
    return;
  }

  if (!password) {
    password = randomPassword(14);
    generated = true;
  }

  const hash = bcrypt.hashSync(password, 12);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run(username, hash, 'owner');

  console.log('Owner account created.');
  console.log('  Username:', username);
  if (generated) {
    console.log('  Password:', password, '(generated — save this now, it will not be shown again)');
  } else {
    console.log('  Password: (the one set in OWNER_PASSWORD)');
  }
}

createOwner();
