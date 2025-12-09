const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  companyName: { type: String, default: 'Goodfella Pools' },
  tagline: { type: String, default: '' },
  address: { type: String, default: '' },
  serviceArea: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  social: {
    facebookUrl: { type: String, default: '' },
    instagramUrl: { type: String, default: '' },
    tiktokUrl: { type: String, default: '' },
    youtubeUrl: { type: String, default: '' },
  },
  seo: {
    defaultTitle: { type: String, default: 'Goodfella Pools' },
    defaultMetaDescription: { type: String, default: '' },
    defaultOgImage: { type: String, default: '' },
  },
  hours: { type: String, default: '' }, // Business hours
  favicon: { type: String, default: '' }, // Favicon path
  // Hero configuration
  heroBackgroundMode: {
    type: String,
    enum: ['color', 'image'],
    default: 'color',
  },
  heroBackgroundImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  heroLogo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  navbarLogo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
  },
  // Theme configuration
  themeName: {
    type: String,
    enum: [
      'waterBlue1',
      'waterBlue2',
      'aqua',
      'deepBlue',
      'tealWave',
      'skyBlue',
      'custom',
    ],
    default: 'waterBlue1',
  },
  // Custom theme colors (only used if themeName === 'custom')
  customTheme: {
    primaryColor: { type: String, default: '#0d6efd' },
    secondaryColor: { type: String, default: '#6c757d' },
    accentColor: { type: String, default: '#0dcaf0' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#000000' },
  },
  // Theme colors for header and footer
  theme: {
    header: {
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#0d6efd' },
      linkColor: { type: String, default: '#000000' },
      linkHoverColor: { type: String, default: '#0d6efd' },
    },
    footer: {
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#6c757d' },
      linkColor: { type: String, default: '#0d6efd' },
      linkHoverColor: { type: String, default: '#0a58ca' },
      borderColor: { type: String, default: '#dee2e6' },
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
