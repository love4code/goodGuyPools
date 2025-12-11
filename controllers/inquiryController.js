const Inquiry = require('../models/Inquiry');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const { sendContactEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

function createEmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

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
    try {
      const transporter = createEmailTransporter();
      if (transporter) {
        const to = process.env.CONTACT_RECEIVER || process.env.SITE_EMAIL || 'Aquarianpoolandspa@gmail.com';
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
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
        
        await transporter.sendMail({
          from,
          to,
          subject: emailSubject,
          html: emailBody,
        });
      } else {
        console.warn('Email disabled. Missing SMTP_USER/SMTP_PASS');
      }
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
    const { name, town, phoneNumber, email, projectType, message, honey } = req.body;
    
    // Simple anti-spam: hidden field must be blank
    if (honey && honey.trim() !== '') {
      req.flash('error', 'Spam detected');
      return res.redirect('back');
    }

    // Validate required fields
    const errors = [];
    if (!name) errors.push('Name is required');
    if (!town) errors.push('Town is required');
    if (!phoneNumber) errors.push('Phone Number is required');
    if (!email) errors.push('Email is required');
    if (!projectType) errors.push('Project Type is required');
    
    if (errors.length) {
      req.flash('error', errors.join(', '));
      return res.redirect('back');
    }

    // Save to Contact model
    const contact = await Contact.create({
      name,
      town,
      phoneNumber,
      email,
      projectType,
      message: message || '',
    });

    // Send email notification using sendContactEmail
    try {
      await sendContactEmail({
        name,
        town,
        phoneNumber,
        email,
        projectType,
        message: message || '',
      });
    } catch (emailErr) {
      console.error('Error sending contact email:', emailErr);
      // Don't fail the request if email fails, data is already saved
    }

    req.flash('success', 'Thanks! Your inquiry has been received.');
    res.redirect('back');
  } catch (e) {
    console.error('Error creating contact inquiry:', e);
    req.flash('error', e.message || 'Error submitting inquiry. Please try again.');
    res.redirect('back');
  }
};
