const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['product', 'contact'],
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  productName: { type: String }, // Store product name for reference
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  size: { type: String }, // If product inquiry
  description: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Inquiry', inquirySchema);

