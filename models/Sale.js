const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  unitCost: { type: Number, default: 0 }, // Cost per unit for profit tracking
  subtotal: { type: Number, required: true, min: 0 },
  costTotal: { type: Number, default: 0 }, // Total cost for this line item (quantity * unitCost)
});

const saleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  lineItems: [lineItemSchema],
  subtotal: { type: Number, required: true, default: 0 },
  taxRate: { type: Number, default: 0.0625 }, // 6.25% sales tax
  taxAmount: { type: Number, required: true, default: 0 },
  totalCost: { type: Number, default: 0 }, // Total cost of all products
  deliveryFee: { type: Number, default: 0 }, // Delivery fee (optional, one per sale)
  profit: { type: Number, default: 0 }, // Profit = (subtotal - totalCost) - taxAmount - deliveryFee
  total: { type: Number, required: true, default: 0 },
  // Keep legacy fields for backward compatibility
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  amount: { type: Number }, // Legacy field, will be calculated from total
  isPaid: { type: Boolean, default: false },
  saleDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

saleSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();
  // Calculate totals if lineItems exist
  if (this.lineItems && this.lineItems.length > 0) {
    this.subtotal = this.lineItems.reduce(
      (sum, item) => sum + (item.subtotal || item.quantity * item.unitPrice),
      0,
    );

    // Calculate tax only on taxable items
    // Need to populate products to check isTaxable
    if (!this.populated('lineItems.product')) {
      await this.populate('lineItems.product', 'isTaxable');
    }

    const taxableSubtotal = this.lineItems.reduce((sum, item) => {
      const itemSubtotal = item.subtotal || item.quantity * item.unitPrice;
      // Check if product is taxable (default to true if not populated or undefined)
      const isTaxable = item.product?.isTaxable !== false;
      return sum + (isTaxable ? itemSubtotal : 0);
    }, 0);

    this.taxAmount = taxableSubtotal * this.taxRate;
    this.total = this.subtotal + this.taxAmount;

    // Calculate total cost - use costTotal if set, otherwise calculate from unitCost
    this.totalCost = this.lineItems.reduce((sum, item) => {
      // Prefer costTotal if it's already set (including 0), otherwise calculate it
      let costTotal = item.costTotal;
      if (costTotal === undefined || costTotal === null) {
        // Calculate costTotal if not set
        const quantity = item.quantity || 0;
        const unitCost = item.unitCost || 0;
        costTotal = quantity * unitCost;
      }
      return sum + (isNaN(costTotal) ? 0 : costTotal);
    }, 0);

    // Calculate profit: (price - cost) for each product, sum them, then subtract delivery fee only
    // For each product: (unitPrice - unitCost) × quantity, then sum all products
    const grossProfit = this.lineItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const unitCost = item.unitCost || 0;
      const itemProfit = (unitPrice - unitCost) * quantity;
      return sum + (isNaN(itemProfit) ? 0 : itemProfit);
    }, 0);

    // Net Profit = Gross Profit (sum of all product profits) - delivery fee (sales tax is NOT deducted from profit)
    const deliveryFee = this.deliveryFee || 0;
    const calculatedProfit = grossProfit - deliveryFee;
    this.profit = isNaN(calculatedProfit) ? 0 : calculatedProfit;

    // Set legacy amount field for backward compatibility
    this.amount = this.total;
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema);
