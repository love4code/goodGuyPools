require('dotenv').config()
const express = require('express')
const path = require('path')
const session = require('express-session')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')

const connectDB = require('./config/db')
const SiteSettings = require('./models/SiteSettings')

const app = express()

// View engine
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Static
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(methodOverride('_method'))
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'goodfella-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
)
app.use(flash())

// Locals for views
app.use((req, res, next) => {
  res.locals.success = req.flash('success')
  res.locals.error = req.flash('error')
  res.locals.isAuthenticated = !!req.session.userId
  next()
})

// Load site settings for all views
app.use(async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne()
    res.locals.siteSettings = settings || {
      companyName: 'Goodfella Pools',
      phone: '',
      email: '',
      social: {},
      seo: { defaultTitle: 'Goodfella Pools', defaultMetaDescription: '' }
    }
  } catch (e) {
    res.locals.siteSettings = {
      companyName: 'Goodfella Pools',
      phone: '',
      email: '',
      social: {},
      seo: { defaultTitle: 'Goodfella Pools', defaultMetaDescription: '' }
    }
  } finally {
    next()
  }
})

// Analytics middleware (basic) - track page views for public pages
const { trackPageView } = require('./middleware/analytics')
app.use(trackPageView)

// Routes
const publicRoutes = require('./routes/public')
const adminRoutes = require('./routes/admin')
app.use('/', publicRoutes)
app.use('/admin', adminRoutes)

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res
    .status(500)
    .render('error', { title: 'Error', error: err.message || 'Server Error' })
})

// 404
app.use((req, res) => {
  res
    .status(404)
    .render('error', { title: 'Not Found', error: 'Page not found' })
})

// Start server after database connection
const PORT = process.env.PORT || 4000

async function startServer() {
  try {
    // Connect to Mongo
    await connectDB()
    
    app.listen(PORT, () => {
      console.log(`Goodfella Pools running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
