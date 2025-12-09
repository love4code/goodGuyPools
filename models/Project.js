const mongoose = require('mongoose');
const slugify = require('slugify');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, index: true },
  summary: { type: String, required: true },
  description: { type: String, default: '' },
  images: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Media',
    default: [],
  },
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['Planned', 'In Progress', 'Completed'],
    default: 'Planned',
  },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

projectSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  if (!this.slug && this.title) {
    let base = slugify(this.title, { lower: true, strict: true });
    if (!base) base = 'project';
    let candidate = base;
    let i = 1;
    const Model = mongoose.model('Project');
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

module.exports = mongoose.model('Project', projectSchema);
