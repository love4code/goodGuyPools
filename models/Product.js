const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  image: { type: String, default: '' }, // file path from media
  sizes: { type: [String], default: [] }, // e.g., ['12x24', '14x28', '16x32']
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

productSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  if (!this.slug && this.name) {
    let base = slugify(this.name, { lower: true, strict: true });
    if (!base) base = 'product';
    let candidate = base;
    let i = 1;
    const Model = mongoose.model('Product');
    while (await Model.findOne({ slug: candidate })) {
      candidate = `${base}-${i++}`;
      if (i > 1000) {
        candidate = `${base}-${Date.now()}`;
        break;
      }
    }
    this.slug = candidate;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
