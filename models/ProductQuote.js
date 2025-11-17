const mongoose = require('mongoose');

const productQuoteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  message: { type: String, default: '' },
  serviceType: {
    type: String,
    enum: ['New Pool Consult', 'Pool Replacement', 'Pool Removal'],
    required: true,
  },
  selectedSizes: { type: [String], default: [] }, // Array of selected pool sizes
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true }, // Store product name for reference
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProductQuote', productQuoteSchema);

