const SiteSettings = require('../models/SiteSettings');
const Media = require('../models/Media');
const mongoose = require('mongoose');

exports.getSettings = async (req, res) => {
  let settings = await SiteSettings.findOne()
    .populate('navbarLogo')
    .populate('heroLogo')
    .populate('heroBackgroundImage');
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

  // Favicon - can be a Media ID (from picker) or a path string (legacy)
  if (
    req.files &&
    req.files.faviconUpload &&
    req.files.faviconUpload[0] &&
    req.files.faviconUpload[0].mediaId
  ) {
    const faviconFile = req.files.faviconUpload[0];
    // Save to Media library
    await Media.create({
      _id: faviconFile.mediaId,
      originalFilename: faviconFile.originalname,
      title: 'Favicon',
      altText: 'Site Favicon',
      tags: ['favicon'],
      sizes: faviconFile.sizes || {},
    });
    // Store GridFS file ID for favicon
    const faviconFileId =
      faviconFile.sizes?.large?.fileId ||
      faviconFile.sizes?.medium?.fileId ||
      faviconFile.sizes?.thumbnail?.fileId;
    if (faviconFileId) {
      settings.favicon = `/admin/media/image/${faviconFileId}`;
    }
  } else if (body.favicon && body.favicon.trim() !== '') {
    // If it's a valid ObjectId, it's from media picker - get the GridFS file ID
    if (mongoose.Types.ObjectId.isValid(body.favicon.trim())) {
      const faviconMedia = await Media.findById(body.favicon.trim());
      if (faviconMedia && faviconMedia.sizes) {
        const faviconFileId =
          faviconMedia.sizes.thumbnail?.fileId ||
          faviconMedia.sizes.medium?.fileId ||
          faviconMedia.sizes.large?.fileId;
        if (faviconFileId) {
          settings.favicon = `/admin/media/image/${faviconFileId}`;
        }
      }
    } else {
      // It's a path string (legacy or already a full URL)
      settings.favicon = body.favicon.trim();
    }
  }
  // Don't clear favicon if not provided - keep existing value

  // Hero Background Image (Media reference)
  if (body.heroBackgroundImage && body.heroBackgroundImage.trim() !== '') {
    // Ensure it's a valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(body.heroBackgroundImage.trim())) {
      settings.heroBackgroundImage = body.heroBackgroundImage.trim();
    }
    // If invalid, don't update - keep existing value
  }
  // Don't clear if not provided - keep existing value

  // Hero Logo (Media reference)
  if (body.heroLogo && body.heroLogo.trim() !== '') {
    // Ensure it's a valid ObjectId string
    if (mongoose.Types.ObjectId.isValid(body.heroLogo.trim())) {
      settings.heroLogo = body.heroLogo.trim();
    }
    // If invalid, don't update - keep existing value
  }
  // Don't clear if not provided - keep existing value

  // Navbar Logo (Media reference)
  if (
    req.files &&
    req.files.logoUpload &&
    req.files.logoUpload[0] &&
    req.files.logoUpload[0].mediaId
  ) {
    const logoFile = req.files.logoUpload[0];
    // Save to Media library
    await Media.create({
      _id: logoFile.mediaId,
      originalFilename: logoFile.originalname,
      title: 'Navbar Logo',
      altText: 'Site Logo',
      tags: ['logo'],
      sizes: logoFile.sizes || {},
    });
    settings.navbarLogo = logoFile.mediaId;
  } else if (body.logo && body.logo.trim() !== '') {
    // If logo field is provided (from media picker), use it as navbarLogo
    if (mongoose.Types.ObjectId.isValid(body.logo.trim())) {
      settings.navbarLogo = body.logo.trim();
    }
    // If invalid, don't update - keep existing value
  } else if (body.navbarLogo && body.navbarLogo.trim() !== '') {
    if (mongoose.Types.ObjectId.isValid(body.navbarLogo.trim())) {
      settings.navbarLogo = body.navbarLogo.trim();
    }
    // If invalid, don't update - keep existing value
  }
  // Don't clear if not provided - keep existing value

  // Hero configuration
  settings.heroBackgroundMode = body.heroBackgroundMode || 'color';

  // Theme settings
  settings.themeName = body.themeName || 'waterBlue1';

  // Custom theme colors (only used if themeName === 'custom')
  if (body.themeName === 'custom') {
    settings.customTheme = {
      primaryColor: body.primaryColor || '#0d6efd',
      secondaryColor: body.secondaryColor || '#6c757d',
      accentColor: body.accentColor || '#0dcaf0',
      backgroundColor: body.backgroundColor || '#ffffff',
      textColor: body.textColor || '#000000',
    };
  }

  settings.updatedAt = new Date();
  await settings.save();
  req.flash('success', 'Settings updated');
  res.redirect('/admin/settings');
};
