const mongoose = require('mongoose');
const slugify = require('slugify');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' }, // Bootstrap Icons class name, e.g. "bi-droplet"
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

serviceSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  if (!this.slug && this.name) {
    let base = slugify(this.name, { lower: true, strict: true });
    if (!base) base = 'service';
    let candidate = base;
    let i = 1;
    const Model = mongoose.model('Service');
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

module.exports = mongoose.model('Service', serviceSchema);
