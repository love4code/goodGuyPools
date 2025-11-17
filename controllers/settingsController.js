const SiteSettings = require('../models/SiteSettings');

exports.getSettings = async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  res.render('admin/settings', { title: 'Site Settings', settings });
};

exports.updateSettings = async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  const body = req.body;
  settings.companyName = body.companyName || settings.companyName;
  settings.tagline = body.tagline || '';
  settings.address = body.address || '';
  settings.serviceArea = body.serviceArea || '';
  settings.phone = body.phone || '';
  settings.email = body.email || '';
  settings.social.facebookUrl = body.facebookUrl || '';
  settings.social.instagramUrl = body.instagramUrl || '';
  settings.social.tiktokUrl = body.tiktokUrl || '';
  settings.social.youtubeUrl = body.youtubeUrl || '';
  settings.seo.defaultTitle = body.defaultTitle || settings.companyName;
  settings.seo.defaultMetaDescription = body.defaultMetaDescription || '';
  settings.seo.defaultOgImage = body.defaultOgImage || '';

  // Hero section settings
  settings.hero.enabled = body.heroEnabled === 'on';
  settings.hero.image = body.heroImage || '';
  settings.hero.title = body.heroTitle || '';
  settings.hero.subtitle = body.heroSubtitle || '';
  settings.hero.buttonText = body.heroButtonText || '';
  settings.hero.buttonLink = body.heroButtonLink || '';

  // Theme settings
  settings.theme.preset = body.themePreset || 'default';
  settings.theme.header.backgroundColor =
    body.headerBackgroundColor || '#ffffff';
  settings.theme.header.textColor = body.headerTextColor || '#0d6efd';
  settings.theme.header.linkColor = body.headerLinkColor || '#000000';
  settings.theme.header.linkHoverColor = body.headerLinkHoverColor || '#0d6efd';
  settings.theme.footer.backgroundColor =
    body.footerBackgroundColor || '#ffffff';
  settings.theme.footer.textColor = body.footerTextColor || '#6c757d';
  settings.theme.footer.linkColor = body.footerLinkColor || '#0d6efd';
  settings.theme.footer.linkHoverColor = body.footerLinkHoverColor || '#0a58ca';
  settings.theme.footer.borderColor = body.footerBorderColor || '#dee2e6';

  settings.updatedAt = new Date();
  await settings.save();
  req.flash('success', 'Settings updated');
  res.redirect('/admin/settings');
};
