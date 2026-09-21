const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL in server/.env — refusing to start without a database.');
  process.exit(1);
}

// Render's free Postgres (and most managed providers) require SSL but use
// a self-signed chain, so we skip CA verification rather than fail to
// connect. Set PGSSL=disable for a plain local Postgres with no TLS.
const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false }
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS content (
      page TEXT NOT NULL,
      key TEXT NOT NULL,
      ru TEXT NOT NULL DEFAULT '',
      kk TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (page, key)
    );

    CREATE TABLE IF NOT EXISTS pending_registrations (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS pending_password_changes (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      new_password_hash TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS lekala_items (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS gallery_photos (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      mime TEXT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      confirmed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      lekala_item_id INTEGER REFERENCES lekala_items(id) ON DELETE SET NULL,
      label TEXT NOT NULL,
      price NUMERIC
    );

    ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE pending_registrations ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE lekala_items ADD COLUMN IF NOT EXISTS price NUMERIC;
    ALTER TABLE lekala_items ADD COLUMN IF NOT EXISTS file_name TEXT;
    ALTER TABLE lekala_items ADD COLUMN IF NOT EXISTS file_mime TEXT;
    ALTER TABLE lekala_items ADD COLUMN IF NOT EXISTS file_data BYTEA;
  `);
}

module.exports = { pool, migrate };
