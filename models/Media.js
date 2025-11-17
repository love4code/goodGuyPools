const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
  gridfsId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID
  filePath: { type: String, required: true }, // /api/images/{gridfsId} for serving
  originalFilename: { type: String, required: true },
  title: { type: String, default: '' },
  altText: { type: String, default: '' },
  tags: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Media', mediaSchema)


