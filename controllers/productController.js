const Product = require('../models/Product');
const Media = require('../models/Media');
const ProductQuote = require('../models/ProductQuote');
const Inquiry = require('../models/Inquiry');
const mongoose = require('mongoose');

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
    // Process uploaded featured image (single file)
    let mainImageId = null;
    if (
      req.files &&
      req.files.featuredImageUpload &&
      req.files.featuredImageUpload.length > 0
    ) {
      const featuredFile = req.files.featuredImageUpload[0];
      if (featuredFile && featuredFile.mediaId) {
        await Media.create({
          _id: featuredFile.mediaId,
          originalFilename: featuredFile.originalname,
          title: req.body.name || '',
          altText: '',
          tags: ['product', 'featured'],
          sizes: featuredFile.sizes || {},
        });
        mainImageId = featuredFile.mediaId;
      }
    } else if (req.body.mainImage && req.body.mainImage.trim() !== '') {
      // From media picker
      if (mongoose.Types.ObjectId.isValid(req.body.mainImage.trim())) {
        mainImageId = req.body.mainImage.trim();
      }
    }

    // Process uploaded gallery images
    const uploadedGalleryIds = [];
    if (
      req.files &&
      req.files.galleryImages &&
      req.files.galleryImages.length > 0
    ) {
      for (const file of req.files.galleryImages) {
        if (file.mediaId) {
          // Save to Media library
          await Media.create({
            _id: file.mediaId,
            originalFilename: file.originalname,
            title: req.body.name || '',
            altText: '',
            tags: ['product'],
            sizes: file.sizes || {},
          });
          uploadedGalleryIds.push(file.mediaId);
        }
      }
    }

    // Process gallery from media picker (comma-separated Media IDs)
    const manualGalleryIds = [];
    if (req.body.gallery && req.body.gallery.trim() !== '') {
      const galleryIds = req.body.gallery
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      for (const id of galleryIds) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          manualGalleryIds.push(id);
        }
      }
    }
    const allGalleryIds = [...uploadedGalleryIds, ...manualGalleryIds];

    const {
      name,
      description,
      shortDescription,
      image,
      sizes,
      sku,
      category,
      brand,
      material,
      shape,
      depth,
      capacity,
      dimensions,
      weight,
      warranty,
      installationTime,
      features,
      specifications,
      priceRange,
      availability,
      metaTitle,
      metaDescription,
      keywords,
      tags,
      notes,
      isActive,
      isFeatured,
      order,
    } = req.body;

    const sizesArray = sizes
      ? sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const featuresArray = features
      ? features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];
    const keywordsArray = keywords
      ? keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];
    const tagsArray = tags
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    await Product.create({
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      mainImage: mainImageId,
      gallery: allGalleryIds,
      sizes: sizesArray,
      price: req.body.price || '',
      sku: sku || '',
      category: category || '',
      brand: brand || '',
      material: material || '',
      shape: shape || '',
      depth: depth || '',
      capacity: capacity || '',
      dimensions: dimensions || '',
      weight: weight || '',
      warranty: warranty || '',
      installationTime: installationTime || '',
      features: featuresArray,
      specifications: specifications || '',
      priceRange: priceRange || '',
      availability: availability || 'In Stock',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      keywords: keywordsArray,
      tags: tagsArray,
      notes: notes || '',
      isActive: isActive === 'on',
      isFeatured: isFeatured === 'on',
      order: Number(order) || 0,
    });
    req.flash('success', 'Product created');
    res.redirect('/admin/products');
  } catch (e) {
    console.error('Error creating product:', e);
    req.flash('error', e.message || 'Error creating product');
    // Preserve form data on error
    const formData = {
      name: req.body.name || '',
      description: req.body.description || '',
      shortDescription: req.body.shortDescription || '',
      sku: req.body.sku || '',
      category: req.body.category || '',
      brand: req.body.brand || '',
      material: req.body.material || '',
      shape: req.body.shape || '',
      depth: req.body.depth || '',
      capacity: req.body.capacity || '',
      dimensions: req.body.dimensions || '',
      weight: req.body.weight || '',
      warranty: req.body.warranty || '',
      installationTime: req.body.installationTime || '',
      features: req.body.features || '',
      specifications: req.body.specifications || '',
      priceRange: req.body.priceRange || '',
      availability: req.body.availability || 'In Stock',
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      keywords: req.body.keywords || '',
      tags: req.body.tags || '',
      notes: req.body.notes || '',
      isActive: req.body.isActive === 'on',
      isFeatured: req.body.isFeatured === 'on',
      order: req.body.order || 0,
      mainImage: req.body.mainImage || '',
      gallery: req.body.gallery || '',
    };
    res.render('admin/product-form', {
      title: 'New Product',
      product: formData,
      error: e.message || 'Error creating product',
    });
  }
};

exports.editForm = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('mainImage')
    .populate('gallery');
  if (!product) {
    req.flash('error', 'Product not found');
    return res.redirect('/admin/products');
  }
  res.render('admin/product-form', { title: 'Edit Product', product });
};

exports.update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    // Process uploaded featured image (single file)
    let mainImageId = product.mainImage || null;
    if (
      req.files &&
      req.files.featuredImageUpload &&
      req.files.featuredImageUpload.length > 0
    ) {
      const featuredFile = req.files.featuredImageUpload[0];
      if (featuredFile && featuredFile.mediaId) {
        await Media.create({
          _id: featuredFile.mediaId,
          originalFilename: featuredFile.originalname,
          title: req.body.name || '',
          altText: '',
          tags: ['product', 'featured'],
          sizes: featuredFile.sizes || {},
        });
        mainImageId = featuredFile.mediaId;
      }
    } else if (req.body.mainImage && req.body.mainImage.trim() !== '') {
      // From media picker
      if (mongoose.Types.ObjectId.isValid(req.body.mainImage.trim())) {
        mainImageId = req.body.mainImage.trim();
      }
    } else if (req.body.mainImage === '') {
      // Clear main image if empty string
      mainImageId = null;
    }

    // Process uploaded gallery images
    const uploadedGalleryIds = [];
    if (
      req.files &&
      req.files.galleryImages &&
      req.files.galleryImages.length > 0
    ) {
      for (const file of req.files.galleryImages) {
        if (file.mediaId) {
          // Save to Media library
          await Media.create({
            _id: file.mediaId,
            originalFilename: file.originalname,
            title: req.body.name || '',
            altText: '',
            tags: ['product'],
            sizes: file.sizes || {},
          });
          uploadedGalleryIds.push(file.mediaId);
        }
      }
    }

    // Process gallery from media picker (comma-separated Media IDs)
    const manualGalleryIds = [];
    if (req.body.gallery && req.body.gallery.trim() !== '') {
      const galleryIds = req.body.gallery
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      for (const id of galleryIds) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          manualGalleryIds.push(id);
        }
      }
    }
    const allGalleryIds = [
      ...(product.gallery || []),
      ...uploadedGalleryIds,
      ...manualGalleryIds,
    ];

    const {
      name,
      description,
      shortDescription,
      image,
      sizes,
      sku,
      category,
      brand,
      material,
      shape,
      depth,
      capacity,
      dimensions,
      weight,
      warranty,
      installationTime,
      features,
      specifications,
      priceRange,
      availability,
      metaTitle,
      metaDescription,
      keywords,
      tags,
      notes,
      isActive,
      isFeatured,
      order,
    } = req.body;

    const sizesArray = sizes
      ? sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const featuresArray = features
      ? features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];
    const keywordsArray = keywords
      ? keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];
    const tagsArray = tags
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const update = {
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      mainImage: mainImageId,
      gallery: allGalleryIds,
      sizes: sizesArray,
      price: req.body.price || '',
      sku: sku || '',
      category: category || '',
      brand: brand || '',
      material: material || '',
      shape: shape || '',
      depth: depth || '',
      capacity: capacity || '',
      dimensions: dimensions || '',
      weight: weight || '',
      warranty: warranty || '',
      installationTime: installationTime || '',
      features: featuresArray,
      specifications: specifications || '',
      priceRange: priceRange || '',
      availability: availability || 'In Stock',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      keywords: keywordsArray,
      tags: tagsArray,
      notes: notes || '',
      isActive: isActive === 'on',
      isFeatured: isFeatured === 'on',
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
  const products = await Product.find({ isActive: true })
    .populate('mainImage')
    .sort({
      order: 1,
      createdAt: -1,
    });
  res.render('products', {
    title: 'Products',
    products,
    siteSettings: res.locals.siteSettings,
  });
};

exports.publicDetail = async (req, res) => {
  const product = await Product.findOne({
    slug: req.params.slug,
    isActive: true,
  })
    .populate('mainImage')
    .populate('gallery');
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
    siteSettings: res.locals.siteSettings,
  });
};

exports.requestQuote = async (req, res) => {
  try {
    const { name, email, phone, size, sizes, description } = req.body;
    const product = await Product.findById(req.body.productId);

    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/products');
    }

    if (!name || !email || !phone) {
      req.flash('error', 'Please fill in all required fields');
      return res.redirect(`/products/${product.slug}`);
    }

    // Handle sizes - support both new array format and legacy single size
    let selectedSizes = [];
    if (sizes && Array.isArray(sizes)) {
      selectedSizes = sizes.filter((s) => s && s.trim() !== '');
    } else if (sizes && typeof sizes === 'string') {
      selectedSizes = [sizes];
    } else if (size) {
      // Legacy support for single size
      selectedSizes = [size];
    }

    // Save inquiry to database
    await Inquiry.create({
      type: 'product',
      product: product._id,
      productName: product.name,
      name,
      email,
      phone,
      size: selectedSizes.length > 0 ? selectedSizes[0] : '', // Keep for backwards compatibility
      sizes: selectedSizes, // New array field
      description: description || '',
    });

    // Send email
    const { sendEmail } = require('../utils/email');
    const emailSubject = `New Product Inquiry: ${product.name}`;
    const sizesText =
      selectedSizes.length > 0 ? selectedSizes.join(', ') : 'Not specified';
    const emailBody = `
      <h2>New Product Inquiry</h2>
      <p><strong>Product:</strong> ${product.name}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      ${
        selectedSizes.length > 0
          ? `<p><strong>Selected Sizes:</strong> ${sizesText}</p>`
          : ''
      }
      ${description ? `<p><strong>Message:</strong><br>${description}</p>` : ''}
    `;

    try {
      await sendEmail({
        to: process.env.SITE_EMAIL,
        subject: emailSubject,
        html: emailBody,
      });
    } catch (emailErr) {
      console.error('Error sending inquiry email:', emailErr);
    }

    req.flash('success', 'Thank you! We will contact you soon.');
    res.redirect(`/products/${product.slug}`);
  } catch (e) {
    req.flash('error', e.message || 'Error submitting inquiry');
    res.redirect(`/products/${req.body.productSlug || ''}`);
  }
};
