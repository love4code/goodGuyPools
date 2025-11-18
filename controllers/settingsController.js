const SiteSettings = require('../models/SiteSettings');
const Media = require('../models/Media');

exports.getSettings = async (req, res) => {
  let settings = await SiteSettings.findOne();
  if (!settings) settings = await SiteSettings.create({});
  // Also pass as siteSettings for consistency with header partial
  res.render('admin/settings', {
    title: 'Site Settings',
    settings,
    siteSettings: settings,
  });
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

  // Favicon
  if (
    req.files &&
    req.files.faviconUpload &&
    req.files.faviconUpload[0] &&
    req.files.faviconUpload[0].path
  ) {
    const faviconFile = req.files.faviconUpload[0];
    // Save to Media library
    await Media.create({
      gridfsId: faviconFile.gridfsId,
      filePath: faviconFile.path,
      originalFilename: faviconFile.originalname,
      title: 'Favicon',
      altText: 'Site Favicon',
      tags: ['favicon'],
      sizes: faviconFile.sizes || {},
    });
    settings.favicon = faviconFile.path;
  } else if (body.favicon) {
    settings.favicon = body.favicon;
  }

  // Logo
  if (
    req.files &&
    req.files.logoUpload &&
    req.files.logoUpload[0] &&
    req.files.logoUpload[0].path
  ) {
    const logoFile = req.files.logoUpload[0];
    // Save to Media library
    await Media.create({
      gridfsId: logoFile.gridfsId,
      filePath: logoFile.path,
      originalFilename: logoFile.originalname,
      title: 'Logo',
      altText: 'Site Logo',
      tags: ['logo'],
      sizes: logoFile.sizes || {},
    });
    settings.logo = logoFile.path;
  } else if (body.logo && body.logo.trim() !== '') {
    settings.logo = body.logo.trim();
  } else if (!body.logo || body.logo.trim() === '') {
    // Keep existing logo if not provided
    // Don't clear it unless explicitly cleared
  }

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
