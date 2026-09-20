require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');

const { migrate } = require('./db');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const registerRoutes = require('./routes/register');

const app = express();
const PORT = process.env.PORT || 4000;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error('Missing SESSION_SECRET in server/.env — refusing to start with an insecure default.');
  process.exit(1);
}

app.use(cors({
  origin: (process.env.ALLOWED_ORIGIN || '').split(',').filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(cookieSession({
  name: 'made_session',
  secret: SESSION_SECRET,
  maxAge: 8 * 60 * 60 * 1000,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
}));

app.use('/api', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', registerRoutes);

// Serve the admin panel
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Serve the public static site (same files GitHub Pages serves)
app.use(express.static(path.join(__dirname, '..'), { extensions: ['html'] }));

// Catches errors thrown/rejected inside asyncHandler-wrapped routes.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MaDE Studio server running on http://localhost:${PORT}`);
      console.log(`Admin panel:            http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  });
