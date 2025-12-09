const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  originalFilename: { type: String, required: true },
  title: { type: String, default: '' },
  altText: { type: String, default: '' },
  tags: { type: [String], default: [] },
  // Image size references with file paths and metadata
  sizes: {
    large: {
      url: { type: String, required: true }, // Relative path from public/uploads/
      width: { type: Number },
      height: { type: Number },
      sizeInKb: { type: Number },
    },
    medium: {
      url: { type: String, required: true },
      width: { type: Number },
      height: { type: Number },
      sizeInKb: { type: Number },
    },
    thumbnail: {
      url: { type: String, required: true },
      width: { type: Number },
      height: { type: Number },
      sizeInKb: { type: Number },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', mediaSchema);
