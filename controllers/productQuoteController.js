const ProductQuote = require('../models/ProductQuote');

exports.list = async (req, res) => {
  const { q = '', read = '', page = 1 } = req.query;
  const perPage = 20;
  const filter = {};
  
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
      { city: new RegExp(q, 'i') },
      { productName: new RegExp(q, 'i') },
    ];
  }
  if (read === 'read') filter.isRead = true;
  if (read === 'unread') filter.isRead = false;
  
  const total = await ProductQuote.countDocuments(filter);
  const quotes = await ProductQuote.find(filter)
    .populate('productId', 'name slug')
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  
  res.render('admin/product-quotes', {
    title: 'Product Quote Requests',
    quotes,
    total,
    page: Number(page),
    perPage,
    q,
    read,
  });
};

exports.detail = async (req, res) => {
  const quote = await ProductQuote.findById(req.params.id).populate(
    'productId',
    'name slug image',
  );
  if (!quote) {
    req.flash('error', 'Quote request not found');
    return res.redirect('/admin/product-quotes');
  }
  res.render('admin/product-quote-detail', {
    title: 'Quote Request Details',
    quote,
  });
};

exports.toggleRead = async (req, res) => {
  const quote = await ProductQuote.findById(req.params.id);
  if (!quote) {
    req.flash('error', 'Quote request not found');
    return res.redirect('/admin/product-quotes');
  }
  quote.isRead = !quote.isRead;
  await quote.save();
  req.flash('success', `Quote marked as ${quote.isRead ? 'read' : 'unread'}`);
  res.redirect(`/admin/product-quotes/${req.params.id}`);
};

exports.remove = async (req, res) => {
  await ProductQuote.findByIdAndDelete(req.params.id);
  req.flash('success', 'Quote request deleted');
  res.redirect('/admin/product-quotes');
};

