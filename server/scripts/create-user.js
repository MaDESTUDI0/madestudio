/**
 * Manual account creation for the owner — self-service registration
 * exists now (register.html), but this is still handy for a second
 * admin account or a manual customer account.
 *
 * Usage:
 *   node scripts/create-user.js <username> <password> [role] [name]
 *
 * role defaults to "customer". Use "owner" only for a second admin.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { pool, migrate } = require('../db');

const [, , username, password, role = 'customer', name = ''] = process.argv;

async function main() {
  if (!username || !password) {
    console.error('Usage: node scripts/create-user.js <username> <password> [role] [name]');
    process.exitCode = 1;
    return;
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exitCode = 1;
    return;
  }

  await migrate();

  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows[0]) {
    console.error(`A user named "${username}" already exists.`);
    process.exitCode = 1;
    return;
  }

  const hash = bcrypt.hashSync(password, 12);
  await pool.query(
    'INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4)',
    [username, hash, role, name || null]
  );

  console.log(`Created "${username}" with role "${role}".`);
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
