function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next()
  req.flash('error', 'Please log in to access admin.')
  return res.redirect('/admin/login')
}

module.exports = { requireAuth }


