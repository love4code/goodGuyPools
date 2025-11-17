const Product = require('../models/Product');
const Media = require('../models/Media');

// Admin Controllers
exports.list = async (req, res) => {
  const products = await Product.find().sort({ order: 1, createdAt: -1 });
  res.render('admin/products', { title: 'Products', products });
};

exports.newForm = (req, res) => {
  res.render('admin/product-form', { title: 'New Product', product: null });
};

exports.create = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      image,
      sizes,
      isActive,
      order,
    } = req.body;
    const sizesArray = sizes
      ? sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    await Product.create({
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      image: image || '',
      sizes: sizesArray,
      isActive: isActive === 'on',
      order: Number(order) || 0,
    });
    req.flash('success', 'Product created');
    res.redirect('/admin/products');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/products/new');
  }
};

exports.editForm = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    req.flash('error', 'Product not found');
    return res.redirect('/admin/products');
  }
  res.render('admin/product-form', { title: 'Edit Product', product });
};

exports.update = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      image,
      sizes,
      isActive,
      order,
    } = req.body;
    const sizesArray = sizes
      ? sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const update = {
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      image: image || '',
      sizes: sizesArray,
      isActive: isActive === 'on',
      order: Number(order) || 0,
      updatedAt: new Date(),
    };
    await Product.findByIdAndUpdate(req.params.id, update, {
      runValidators: true,
    });
    req.flash('success', 'Product updated');
    res.redirect('/admin/products');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  req.flash('success', 'Product deleted');
  res.redirect('/admin/products');
};

// Public Controllers
exports.publicList = async (req, res) => {
  const products = await Product.find({ isActive: true }).sort({
    order: 1,
    createdAt: -1,
  });
  res.render('products', { title: 'Products', products });
};

exports.publicDetail = async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  });
  if (!product) {
    return res
      .status(404)
      .render('error', { title: 'Not Found', error: 'Product not found' });
  }
  const success = req.flash('success');
  const error = req.flash('error');
  res.render('product-detail', {
    title: product.name,
    product,
    success,
    error,
  });
};

exports.requestQuote = async (req, res) => {
  try {
    const { name, city, email, phone, message, serviceType, selectedSizes } =
      req.body;
    const product = await Product.findById(req.body.productId);

    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/products');
    }

    // Parse selectedSizes if it's a JSON string
    let sizesArray = [];
    if (selectedSizes) {
      try {
        sizesArray = JSON.parse(selectedSizes);
      } catch (e) {
        // If not JSON, treat as array or single value
        sizesArray = Array.isArray(selectedSizes)
          ? selectedSizes
          : [selectedSizes];
      }
    }

    // Send email
    const { sendQuoteRequestEmail } = require('../utils/email');
    await sendQuoteRequestEmail({
      name,
      city,
      email,
      phone,
      message,
      serviceType,
      selectedSizes: sizesArray,
      productName: product.name,
    });

    req.flash(
      'success',
      'Thank you! Your quote request has been submitted. We will contact you soon.',
    );
    res.redirect(`/products/${product.slug}`);
  } catch (e) {
    req.flash(
      'error',
      'There was an error submitting your request. Please try again.',
    );
    res.redirect(`/products/${req.body.productSlug || ''}`);
  }
};
