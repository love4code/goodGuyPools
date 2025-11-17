const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  image: { type: String, default: '' }, // file path from media
  gallery: { type: [String], default: [] }, // array of file paths for product gallery
  sizes: { type: [String], default: [] }, // e.g., ['12x24', '14x28', '16x32']

  // Product Metadata
  sku: { type: String, default: '' }, // Product SKU/Code
  category: { type: String, default: '' }, // Product category
  brand: { type: String, default: '' }, // Brand/Manufacturer
  material: { type: String, default: '' }, // Material type (e.g., Fiberglass, Vinyl, Concrete)
  shape: { type: String, default: '' }, // Pool shape (e.g., Rectangle, Oval, Freeform)
  depth: { type: String, default: '' }, // Depth specifications
  capacity: { type: String, default: '' }, // Water capacity
  dimensions: { type: String, default: '' }, // Overall dimensions
  weight: { type: String, default: '' }, // Weight specifications
  warranty: { type: String, default: '' }, // Warranty information
  installationTime: { type: String, default: '' }, // Estimated installation time
  features: { type: [String], default: [] }, // Array of features (e.g., ['LED Lighting', 'Heating System'])
  specifications: { type: String, default: '' }, // Technical specifications (HTML allowed)
  priceRange: { type: String, default: '' }, // Price range or starting price
  availability: {
    type: String,
    enum: ['In Stock', 'Out of Stock', 'Pre-Order', 'Discontinued'],
    default: 'In Stock',
  },

  // SEO & Marketing
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  keywords: { type: [String], default: [] }, // SEO keywords
  tags: { type: [String], default: [] }, // Product tags for filtering

  // Additional Info
  notes: { type: String, default: '' }, // Internal notes
  relatedProducts: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Product',
    default: [],
  }, // Related products

  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
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
