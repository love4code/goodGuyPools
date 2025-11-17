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
  theme: {
    preset: {
      type: String,
      enum: [
        'default',
        'ocean-blue',
        'sky-blue',
        'navy-blue',
        'royal-blue',
        'dark',
        'light',
      ],
      default: 'default',
    },
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
