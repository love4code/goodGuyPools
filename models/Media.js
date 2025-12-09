const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  originalFilename: { type: String, required: true },
  title: { type: String, default: '' },
  altText: { type: String, default: '' },
  tags: { type: [String], default: [] },
  // Image size references with GridFS file IDs and metadata
  sizes: {
    large: {
      fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID
      width: { type: Number },
      height: { type: Number },
      sizeInKb: { type: Number },
    },
    medium: {
      fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID
      width: { type: Number },
      height: { type: Number },
      sizeInKb: { type: Number },
    },
    thumbnail: {
      fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file ID
      width: { type: Number },
      height: { type: Number },
      sizeInKb: { type: Number },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Media', mediaSchema);
