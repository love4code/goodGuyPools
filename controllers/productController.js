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
    // Process uploaded featured image (single file)
    let featuredImagePath = req.body.image || '';
    if (
      req.files &&
      req.files.featuredImageUpload &&
      req.files.featuredImageUpload.length > 0
    ) {
      const featuredFile = req.files.featuredImageUpload[0];
      if (featuredFile && featuredFile.path) {
        await Media.create({
          gridfsId: featuredFile.gridfsId,
          filePath: featuredFile.path,
          originalFilename: featuredFile.originalname,
          title: req.body.name || '',
          altText: '',
          tags: ['product', 'featured'],
        });
        featuredImagePath = featuredFile.path;
      }
    }

    // Process uploaded gallery images
    const uploadedGalleryPaths = [];
    if (
      req.files &&
      req.files.galleryImages &&
      req.files.galleryImages.length > 0
    ) {
      for (const file of req.files.galleryImages) {
        if (file.path) {
          // Save to Media library
          await Media.create({
            gridfsId: file.gridfsId,
            filePath: file.path,
            originalFilename: file.originalname,
            title: req.body.name || '',
            altText: '',
            tags: ['product'],
          });
          uploadedGalleryPaths.push(file.path);
        }
      }
    }

    // Combine uploaded images with manually entered paths
    const manualGallery = Array.isArray(req.body.gallery)
      ? req.body.gallery
      : req.body.gallery
      ? req.body.gallery
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
    const allGalleryPaths = [...uploadedGalleryPaths, ...manualGallery];

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
      image: featuredImagePath || image || '',
      gallery: allGalleryPaths,
      sizes: sizesArray,
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
    // Process uploaded featured image (single file)
    let featuredImagePath = req.body.image || '';
    if (
      req.files &&
      req.files.featuredImageUpload &&
      req.files.featuredImageUpload.length > 0
    ) {
      const featuredFile = req.files.featuredImageUpload[0];
      if (featuredFile && featuredFile.path) {
        await Media.create({
          gridfsId: featuredFile.gridfsId,
          filePath: featuredFile.path,
          originalFilename: featuredFile.originalname,
          title: req.body.name || '',
          altText: '',
          tags: ['product', 'featured'],
        });
        featuredImagePath = featuredFile.path;
      }
    }

    // Process uploaded gallery images
    const uploadedGalleryPaths = [];
    if (
      req.files &&
      req.files.galleryImages &&
      req.files.galleryImages.length > 0
    ) {
      for (const file of req.files.galleryImages) {
        if (file.path) {
          // Save to Media library
          await Media.create({
            gridfsId: file.gridfsId,
            filePath: file.path,
            originalFilename: file.originalname,
            title: req.body.name || '',
            altText: '',
            tags: ['product'],
          });
          uploadedGalleryPaths.push(file.path);
        }
      }
    }

    // Combine uploaded images with manually entered paths
    const manualGallery = Array.isArray(req.body.gallery)
      ? req.body.gallery
      : req.body.gallery
      ? req.body.gallery
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];
    const allGalleryPaths = [...uploadedGalleryPaths, ...manualGallery];

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
      image: featuredImagePath || image || '',
      gallery: allGalleryPaths,
      sizes: sizesArray,
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
