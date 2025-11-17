const PageView = require('../models/PageView')

async function trackPageView(req, res, next) {
  try {
    // Only track GET requests to public pages
    if (req.method === 'GET' && !req.path.startsWith('/admin')) {
      await PageView.create({ path: req.path })
    }
  } catch (e) {
    // don't block requests if tracking fails
    console.error('Analytics error:', e.message)
  } finally {
    next()
  }
}

module.exports = { trackPageView }


