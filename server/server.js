require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');

const { migrate } = require('./db');
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const registerRoutes = require('./routes/register');
const lekalaRoutes = require('./routes/lekala');
const galleryRoutes = require('./routes/gallery');
const ordersRoutes = require('./routes/orders');
const courseAccessRoutes = require('./routes/course-access');

const app = express();
const PORT = process.env.PORT || 4000;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error('Missing SESSION_SECRET in server/.env — refusing to start with an insecure default.');
  process.exit(1);
}

// Render (and most hosts) put the app behind a reverse proxy, so without
// this, req.ip is the proxy's address for every request — the per-IP
// rate limits below (and the ones already in routes/auth.js and
// routes/register.js) would silently lump every visitor into one bucket.
app.set('trust proxy', 1);

app.use(cors({
  origin: (process.env.ALLOWED_ORIGIN || '').split(',').filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));
// The frontend (GitHub Pages) and this API live on different origins,
// so every logged-in request after the initial login is a cross-site
// fetch. SameSite=Lax cookies are withheld from cross-site fetch/XHR
// (only sent on top-level navigation), which silently drops the
// session on the very next page — hence "logs out" when navigating.
// SameSite=None is required for cross-site fetch, and browsers require
// Secure to be set whenever SameSite=None is used.
const isProd = process.env.NODE_ENV === 'production';
app.use(cookieSession({
  name: 'made_session',
  secret: SESSION_SECRET,
  maxAge: 8 * 60 * 60 * 1000,
  sameSite: isProd ? 'none' : 'lax',
  secure: isProd
}));

// Blanket abuse/flood limiter for the whole API. This is not DDoS
// protection — a real volumetric attack is stopped upstream by
// Render/Cloudflare and GitHub Pages/Fastly, not application code — it
// just stops a single client from hammering the service and starving
// real visitors. The login/register endpoints layer their own tighter,
// more targeted limits on top of this in routes/auth.js and
// routes/register.js.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' }
});
app.use('/api', apiLimiter);

app.use('/api', authRoutes);
app.use('/api', contentRoutes);
app.use('/api', registerRoutes);
app.use('/api', lekalaRoutes);
app.use('/api', galleryRoutes);
app.use('/api', ordersRoutes);
app.use('/api', courseAccessRoutes);

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
      console.log(`MaDE server running on http://localhost:${PORT}`);
      console.log(`Admin panel:            http://localhost:${PORT}/admin`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  });
