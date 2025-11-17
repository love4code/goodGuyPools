const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  gridfsId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID (original/large)
  filePath: { type: String, required: true }, // /api/images/{gridfsId} for serving (large/original)
  originalFilename: { type: String, required: true },
  title: { type: String, default: '' },
  altText: { type: String, default: '' },
  tags: { type: [String], default: [] },
  // Image size references
  sizes: {
    thumbnail: {
      gridfsId: { type: mongoose.Schema.Types.ObjectId },
      filePath: { type: String }, // /api/images/{gridfsId}
    },
    medium: {
      gridfsId: { type: mongoose.Schema.Types.ObjectId },
      filePath: { type: String }, // /api/images/{gridfsId}
    },
    large: {
      gridfsId: { type: mongoose.Schema.Types.ObjectId },
      filePath: { type: String }, // /api/images/{gridfsId}
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', mediaSchema);
