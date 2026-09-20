/**
 * Manual account creation for the owner — there's no public sign-up yet
 * (people ask for an account via DM), so this is how you add one.
 *
 * Usage:
 *   node scripts/create-user.js <username> <password> [role]
 *
 * role defaults to "customer". Use "owner" only for a second admin.
 */
const bcrypt = require('bcryptjs');
const db = require('../db');

const [, , username, password, role = 'customer'] = process.argv;

if (!username || !password) {
  console.error('Usage: node scripts/create-user.js <username> <password> [role]');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  console.error(`A user named "${username}" already exists.`);
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
  .run(username, hash, role);

console.log(`Created "${username}" with role "${role}".`);
