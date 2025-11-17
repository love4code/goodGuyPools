const mongoose = require('mongoose')

const pageViewSchema = new mongoose.Schema({
  path: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
})

module.exports = mongoose.model('PageView', pageViewSchema)


