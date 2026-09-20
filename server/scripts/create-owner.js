require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool, migrate } = require('../db');

function randomPassword(len = 16) {
  return crypto.randomBytes(len).toString('base64url').slice(0, len);
}

async function createOwner() {
  await migrate();

  const username = process.env.OWNER_USERNAME || 'owner';
  let password = process.env.OWNER_PASSWORD;
  let generated = false;

  const { rows } = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (rows[0]) {
    console.log(`Owner account "${username}" already exists — skipping.`);
    console.log('To reset the password, delete the user from the database or set a new OWNER_PASSWORD and re-run.');
    return;
  }

  if (!password) {
    password = randomPassword(14);
    generated = true;
  }

  const hash = bcrypt.hashSync(password, 12);
  await pool.query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
    [username, hash, 'owner']
  );

  console.log('Owner account created.');
  console.log('  Username:', username);
  if (generated) {
    console.log('  Password:', password, '(generated — save this now, it will not be shown again)');
  } else {
    console.log('  Password: (the one set in OWNER_PASSWORD)');
  }
}

createOwner()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => pool.end());
