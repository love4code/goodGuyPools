require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const { default: MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const flash = require('connect-flash');

const connectDB = require('./config/db');
const SiteSettings = require('./models/SiteSettings');

const app = express();

// Trust proxy (required for Heroku and HTTPS)
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Redirect to www and force HTTPS (production only)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    const host = req.headers.host;
    const shouldBe = 'www.goodguypools.com';

    if (host !== shouldBe) {
      return res.redirect(301, `https://${shouldBe}${req.url}`);
    }

    // optionally also force https if you're terminating SSL at Heroku:
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${host}${req.url}`);
    }

    next();
  });
}

// Static
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));

// Session configuration with MongoDB store for persistence
const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/goodfella_pools';

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'goodfella-secret-change-me',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Extend session expiration on activity
  store: MongoStore.create({
    mongoUrl: mongoUri,
    touchAfter: 24 * 3600, // Only update session once per day (in seconds)
    ttl: 60 * 60 * 24 * 7, // 7 days in seconds
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // 'lax' works better with redirects than 'strict'
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days for authenticated users
  },
};

app.use(session(sessionConfig));
app.use(flash());

// Locals for views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.isAuthenticated = !!req.session.userId;
  // Add base URL for absolute URLs (needed for Open Graph)
  const protocol = req.protocol || 'https';
  const host =
    req.get('host') ||
    (process.env.SITE_URL
      ? new URL(process.env.SITE_URL).host
      : 'www.goodguypools.com');
  res.locals.baseUrl = `${protocol}://${host}`;
  next();
});

// Load site settings for all views
app.use(async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne()
      .populate('navbarLogo')
      .populate('heroLogo')
      .populate('heroBackgroundImage');
    res.locals.siteSettings = settings || {
      companyName: 'Goodfella Pools',
      phone: '',
      email: '',
      social: {},
      seo: { defaultTitle: 'Goodfella Pools', defaultMetaDescription: '' },
    };
  } catch (e) {
    res.locals.siteSettings = {
      companyName: 'Goodfella Pools',
      phone: '',
      email: '',
      social: {},
      seo: { defaultTitle: 'Goodfella Pools', defaultMetaDescription: '' },
    };
  } finally {
    next();
  }
});

// Analytics middleware (basic) - track page views for public pages
const { trackPageView } = require('./middleware/analytics');
app.use(trackPageView);

// Routes
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
app.use('/', publicRoutes);
app.use('/admin', adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .render('error', { title: 'Error', error: err.message || 'Server Error' });
});

// 404
app.use((req, res) => {
  res
    .status(404)
    .render('error', { title: 'Not Found', error: 'Page not found' });
});

// Start server after database connection
const PORT = process.env.PORT || 4000;

async function startServer () {
  try {
    // Connect to Mongo
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Goodfella Pools running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
