const Sale = require('../models/Sale');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

exports.list = async (req, res) => {
  const { page = 1, paid = '', customerId = '' } = req.query;
  const perPage = 20;
  const filter = {};
  if (paid === 'true') filter.isPaid = true;
  if (paid === 'false') filter.isPaid = false;
  if (customerId) filter.customer = customerId;
  const total = await Sale.countDocuments(filter);
  const sales = await Sale.find(filter)
    .populate('customer', 'name email phone')
    .populate('product', 'name slug')
    .populate('lineItems.product', 'name slug')
    .sort({ saleDate: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  res.render('admin/sales', {
    title: 'Sales',
    sales,
    total,
    page: Number(page),
    perPage,
    paid,
    customerId,
  });
};

exports.newForm = async (req, res) => {
  const customers = await Customer.find().sort({ name: 1 });
  const products = await Product.find().sort({ name: 1 });
  res.render('admin/sale-form', {
    title: 'New Sale',
    sale: null,
    customers,
    products,
    customerId: req.query.customerId || '',
  });
};

exports.create = async (req, res) => {
  try {
    const { customer, isPaid, saleDate, notes, lineItems } = req.body;
    if (!customer) {
      req.flash('error', 'Customer is required');
      return res.redirect('/admin/sales/new');
    }

    // Handle lineItems - can come as arrays or single values
    let processedLineItems = [];
    const TAX_RATE = 0.0625; // 6.25%

    if (lineItems && lineItems.product) {
      // Handle array of products
      const products = Array.isArray(lineItems.product)
        ? lineItems.product
        : [lineItems.product];
      const quantities = Array.isArray(lineItems.quantity)
        ? lineItems.quantity
        : [lineItems.quantity || 1];
      const unitPrices = Array.isArray(lineItems.unitPrice)
        ? lineItems.unitPrice
        : [lineItems.unitPrice || 0];

      for (let i = 0; i < products.length; i++) {
        if (products[i] && quantities[i] && unitPrices[i]) {
          const quantity = Number(quantities[i]);
          const unitPrice = Number(unitPrices[i]);
          processedLineItems.push({
            product: products[i],
            quantity: quantity,
            unitPrice: unitPrice,
            subtotal: quantity * unitPrice,
          });
        }
      }
    }

    if (processedLineItems.length === 0) {
      req.flash('error', 'At least one product is required');
      return res.redirect('/admin/sales/new');
    }

    const subtotal = processedLineItems.reduce((sum, item) => {
      const itemSubtotal = item.subtotal || 0;
      return sum + (isNaN(itemSubtotal) ? 0 : itemSubtotal);
    }, 0);

    // Calculate tax only on taxable items and get product costs
    const productIds = processedLineItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select(
      '_id isTaxable cost',
    );
    const productTaxableMap = {};
    const productCostMap = {};
    products.forEach((p) => {
      productTaxableMap[p._id.toString()] = p.isTaxable !== false; // Default to taxable
      productCostMap[p._id.toString()] = p.cost || 0;
    });

    // Add costs to line items
    processedLineItems = processedLineItems.map((item) => {
      const unitCost = productCostMap[item.product.toString()] || 0;
      return {
        ...item,
        unitCost: unitCost,
        costTotal: item.quantity * unitCost,
      };
    });

    const taxableSubtotal = processedLineItems.reduce((sum, item) => {
      const isTaxable = productTaxableMap[item.product.toString()] !== false;
      const itemSubtotal = item.subtotal || 0;
      return sum + (isTaxable ? (isNaN(itemSubtotal) ? 0 : itemSubtotal) : 0);
    }, 0);

    const taxAmount = (isNaN(taxableSubtotal) ? 0 : taxableSubtotal) * TAX_RATE;
    const total =
      (isNaN(subtotal) ? 0 : subtotal) + (isNaN(taxAmount) ? 0 : taxAmount);

    // Calculate total cost
    const totalCost = processedLineItems.reduce((sum, item) => {
      const cost = item.costTotal || 0;
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // Calculate profit: (price - cost) for each product, sum them, then subtract delivery fee only
    // For each product: (unitPrice - unitCost) × quantity, then sum all products
    const grossProfit = processedLineItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const unitCost = item.unitCost || 0;
      const itemProfit = (unitPrice - unitCost) * quantity;
      return sum + (isNaN(itemProfit) ? 0 : itemProfit);
    }, 0);

    const deliveryFee = Number(req.body.deliveryFee) || 0;
    // Net Profit = Gross Profit (sum of all product profits) - delivery fee (sales tax is NOT deducted from profit)
    const calculatedProfit = grossProfit - deliveryFee;
    const profit = isNaN(calculatedProfit) ? 0 : calculatedProfit;

    await Sale.create({
      customer,
      lineItems: processedLineItems,
      subtotal: isNaN(subtotal) ? 0 : subtotal,
      taxRate: TAX_RATE,
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      totalCost: isNaN(totalCost) ? 0 : totalCost,
      deliveryFee: isNaN(deliveryFee) ? 0 : deliveryFee,
      profit,
      total: isNaN(total) ? 0 : total,
      isPaid: isPaid === 'on' || isPaid === true,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      notes: notes || '',
    });
    req.flash('success', 'Sale created');
    res.redirect('/admin/sales');
  } catch (e) {
    console.error('Error creating sale:', e);
    req.flash('error', e.message || 'Error creating sale');
    const customers = await Customer.find().sort({ name: 1 });
    const products = await Product.find().sort({ name: 1 });
    res.render('admin/sale-form', {
      title: 'New Sale',
      sale: req.body,
      customers,
      products,
      customerId: req.query.customerId || '',
    });
  }
};

exports.detail = async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('customer')
    .populate('product')
    .populate('lineItems.product');
  if (!sale) {
    req.flash('error', 'Sale not found');
    return res.redirect('/admin/sales');
  }
  res.render('admin/sale-detail', {
    title: 'Sale Detail',
    sale,
  });
};

exports.editForm = async (req, res) => {
  const sale = await Sale.findById(req.params.id).populate('lineItems.product');
  if (!sale) {
    req.flash('error', 'Sale not found');
    return res.redirect('/admin/sales');
  }
  const customers = await Customer.find().sort({ name: 1 });
  const products = await Product.find().sort({ name: 1 });
  res.render('admin/sale-form', {
    title: 'Edit Sale',
    sale,
    customers,
    products,
  });
};

exports.update = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      req.flash('error', 'Sale not found');
      return res.redirect('/admin/sales');
    }
    const { customer, isPaid, saleDate, notes, lineItems } = req.body;
    const TAX_RATE = 0.0625; // 6.25%

    // Handle lineItems
    let processedLineItems = [];
    if (lineItems && lineItems.product) {
      const products = Array.isArray(lineItems.product)
        ? lineItems.product
        : [lineItems.product];
      const quantities = Array.isArray(lineItems.quantity)
        ? lineItems.quantity
        : [lineItems.quantity || 1];
      const unitPrices = Array.isArray(lineItems.unitPrice)
        ? lineItems.unitPrice
        : [lineItems.unitPrice || 0];

      for (let i = 0; i < products.length; i++) {
        if (products[i] && quantities[i] && unitPrices[i]) {
          const quantity = Number(quantities[i]);
          const unitPrice = Number(unitPrices[i]);
          processedLineItems.push({
            product: products[i],
            quantity: quantity,
            unitPrice: unitPrice,
            subtotal: quantity * unitPrice,
          });
        }
      }
    }

    if (processedLineItems.length === 0) {
      req.flash('error', 'At least one product is required');
      return res.redirect(`/admin/sales/${req.params.id}/edit`);
    }

    const subtotal = processedLineItems.reduce((sum, item) => {
      const itemSubtotal = item.subtotal || 0;
      return sum + (isNaN(itemSubtotal) ? 0 : itemSubtotal);
    }, 0);

    // Calculate tax only on taxable items and get product costs
    const productIds = processedLineItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select(
      '_id isTaxable cost',
    );
    const productTaxableMap = {};
    const productCostMap = {};
    products.forEach((p) => {
      productTaxableMap[p._id.toString()] = p.isTaxable !== false; // Default to taxable
      productCostMap[p._id.toString()] = p.cost || 0;
    });

    // Add costs to line items
    processedLineItems = processedLineItems.map((item) => {
      const unitCost = productCostMap[item.product.toString()] || 0;
      return {
        ...item,
        unitCost: unitCost,
        costTotal: item.quantity * unitCost,
      };
    });

    const taxableSubtotal = processedLineItems.reduce((sum, item) => {
      const isTaxable = productTaxableMap[item.product.toString()] !== false;
      const itemSubtotal = item.subtotal || 0;
      return sum + (isTaxable ? (isNaN(itemSubtotal) ? 0 : itemSubtotal) : 0);
    }, 0);

    const taxAmount = (isNaN(taxableSubtotal) ? 0 : taxableSubtotal) * TAX_RATE;
    const total =
      (isNaN(subtotal) ? 0 : subtotal) + (isNaN(taxAmount) ? 0 : taxAmount);

    // Calculate total cost
    const totalCost = processedLineItems.reduce((sum, item) => {
      const cost = item.costTotal || 0;
      return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    // Calculate profit: (price - cost) for each product, sum them, then subtract delivery fee only
    // For each product: (unitPrice - unitCost) × quantity, then sum all products
    const grossProfit = processedLineItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const unitCost = item.unitCost || 0;
      const itemProfit = (unitPrice - unitCost) * quantity;
      return sum + (isNaN(itemProfit) ? 0 : itemProfit);
    }, 0);

    const deliveryFee = Number(req.body.deliveryFee) || 0;
    // Net Profit = Gross Profit (sum of all product profits) - delivery fee (sales tax is NOT deducted from profit)
    const calculatedProfit = grossProfit - deliveryFee;
    const profit = isNaN(calculatedProfit) ? 0 : calculatedProfit;

    sale.customer = customer;
    sale.lineItems = processedLineItems;
    sale.subtotal = isNaN(subtotal) ? 0 : subtotal;
    sale.taxRate = TAX_RATE;
    sale.taxAmount = isNaN(taxAmount) ? 0 : taxAmount;
    sale.totalCost = isNaN(totalCost) ? 0 : totalCost;
    sale.deliveryFee = isNaN(deliveryFee) ? 0 : deliveryFee;
    sale.profit = profit;
    sale.total = isNaN(total) ? 0 : total;
    sale.isPaid = isPaid === 'on' || isPaid === true;
    sale.saleDate = saleDate ? new Date(saleDate) : sale.saleDate;
    sale.notes = notes || '';
    sale.updatedAt = new Date();
    await sale.save();
    req.flash('success', 'Sale updated');
    res.redirect(`/admin/sales/${sale._id}`);
  } catch (e) {
    req.flash('error', e.message || 'Error updating sale');
    res.redirect(`/admin/sales/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  await Sale.findByIdAndDelete(req.params.id);
  req.flash('success', 'Sale deleted');
  res.redirect('/admin/sales');
};
