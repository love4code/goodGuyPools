const mongoose = require('mongoose')

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
    youtubeUrl: { type: String, default: '' }
  },
  seo: {
    defaultTitle: { type: String, default: 'Goodfella Pools' },
    defaultMetaDescription: { type: String, default: '' },
    defaultOgImage: { type: String, default: '' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('SiteSettings', siteSettingsSchema)


