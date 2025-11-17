const mongoose = require('mongoose')

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  town: { type: String, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  projectType: {
    type: String,
    enum: ['New pool construction', 'Renovation', 'Maintenance/Service'],
    required: true
  },
  message: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Contact', contactSchema)


