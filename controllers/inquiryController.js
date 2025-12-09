const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/email');

exports.list = async (req, res) => {
  const inquiries = await Inquiry.find()
    .populate('product', 'name slug')
    .sort({ createdAt: -1 });
  res.render('admin/inquiries', {
    title: 'Customer Inquiries',
    inquiries,
  });
};

exports.detail = async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate(
    'product',
    'name slug',
  );
  if (!inquiry) {
    req.flash('error', 'Inquiry not found');
    return res.redirect('/admin/inquiries');
  }
  res.render('admin/inquiry-detail', {
    title: 'Inquiry Details',
    inquiry,
  });
};

exports.remove = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      req.flash('error', 'Inquiry not found');
      return res.redirect('/admin/inquiries');
    }
    await Inquiry.findByIdAndDelete(req.params.id);
    req.flash('success', 'Inquiry deleted');
    res.redirect('/admin/inquiries');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/inquiries');
  }
};

// Public endpoint for product inquiry form submission
exports.createProductInquiry = async (req, res) => {
  try {
    const { productId, name, email, phone, size, description } = req.body;

    if (!productId || !name || !email || !phone) {
      req.flash('error', 'Please fill in all required fields');
      return res.redirect('back');
    }

    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('back');
    }

    const inquiry = await Inquiry.create({
      type: 'product',
      product: productId,
      productName: product.name,
      name,
      email,
      phone,
      size: size || '',
      description: description || '',
    });

    // Send email notification
    const emailSubject = `New Product Inquiry: ${product.name}`;
    const emailBody = `
      <h2>New Product Inquiry</h2>
      <p><strong>Product:</strong> ${product.name}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      ${size ? `<p><strong>Size:</strong> ${size}</p>` : ''}
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
    res.redirect('back');
  } catch (e) {
    req.flash('error', e.message || 'Error submitting inquiry');
    res.redirect('back');
  }
};

// Public endpoint for general contact form submission
exports.createContactInquiry = async (req, res) => {
  try {
    const { name, email, phone, description } = req.body;

    if (!name || !email || !phone) {
      req.flash('error', 'Please fill in all required fields');
      return res.redirect('back');
    }

    const inquiry = await Inquiry.create({
      type: 'contact',
      name,
      email,
      phone,
      description: description || '',
    });

    // Send email notification
    const emailSubject = 'New Contact Inquiry';
    const emailBody = `
      <h2>New Contact Inquiry</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
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
    res.redirect('back');
  } catch (e) {
    req.flash('error', e.message || 'Error submitting inquiry');
    res.redirect('back');
  }
};

