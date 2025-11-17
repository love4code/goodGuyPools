const SiteSettings = require('../models/SiteSettings')

exports.getSettings = async (req, res) => {
  let settings = await SiteSettings.findOne()
  if (!settings) settings = await SiteSettings.create({})
  res.render('admin/settings', { title: 'Site Settings', settings })
}

exports.updateSettings = async (req, res) => {
  let settings = await SiteSettings.findOne()
  if (!settings) settings = await SiteSettings.create({})
  const body = req.body
  settings.companyName = body.companyName || settings.companyName
  settings.tagline = body.tagline || ''
  settings.address = body.address || ''
  settings.serviceArea = body.serviceArea || ''
  settings.phone = body.phone || ''
  settings.email = body.email || ''
  settings.social.facebookUrl = body.facebookUrl || ''
  settings.social.instagramUrl = body.instagramUrl || ''
  settings.social.tiktokUrl = body.tiktokUrl || ''
  settings.social.youtubeUrl = body.youtubeUrl || ''
  settings.seo.defaultTitle = body.defaultTitle || settings.companyName
  settings.seo.defaultMetaDescription = body.defaultMetaDescription || ''
  settings.seo.defaultOgImage = body.defaultOgImage || ''
  settings.updatedAt = new Date()
  await settings.save()
  req.flash('success', 'Settings updated')
  res.redirect('/admin/settings')
}


