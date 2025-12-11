const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const { sendContactEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

function createEmailTransporter () {
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
  console.log('\n\n=== inquiries.list FUNCTION CALLED ===');
  console.log('Time:', new Date().toISOString());
  try {
    // Test database connection
    const dbState = mongoose.connection.readyState;
    console.log(
      'Database connection state:',
      dbState === 1 ? 'Connected' : 'Not connected',
    );
    console.log('Database name:', mongoose.connection.name);

    // Count with empty filter
    const totalCount = await Inquiry.countDocuments({});
    console.log('Total inquiries in database (empty filter):', totalCount);

    // Count all documents
    const totalAll = await Inquiry.countDocuments();
    console.log('Total inquiries (no filter):', totalAll);

    // Try to find all inquiries without any filters
    const allInquiries = await Inquiry.find({}).lean();
    console.log(
      'Raw inquiries found (no populate, empty filter):',
      allInquiries.length,
    );
    if (allInquiries.length > 0) {
      console.log(
        'First inquiry raw data:',
        JSON.stringify(allInquiries[0], null, 2),
      );
    }

    // Try with populate
    const inquiries = await Inquiry.find({})
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found inquiries (with populate):', inquiries.length);
    if (inquiries.length > 0) {
      console.log('Sample inquiry:', {
        _id: inquiries[0]._id,
        type: inquiries[0].type,
        name: inquiries[0].name,
        email: inquiries[0].email,
        createdAt: inquiries[0].createdAt,
      });
    } else {
      console.log('WARNING: No inquiries found in database!');
      console.log('This could mean:');
      console.log('  1. No inquiries have been saved');
      console.log('  2. Database connection issue');
      console.log('  3. Wrong database/collection');
    }

    res.render('admin/inquiries', {
      title: 'Customer Inquiries',
      inquiries: inquiries || [],
    });
  } catch (error) {
    console.error('=== ERROR in inquiries.list ===');
    console.error('Error fetching inquiries:', error);
    console.error('Error stack:', error.stack);
    req.flash('error', 'Error loading inquiries');
    res.render('admin/inquiries', {
      title: 'Customer Inquiries',
      inquiries: [],
    });
  }
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
  // Log immediately - this should ALWAYS show if function is called
  console.log('\n\n========================================');
  console.log('=== createProductInquiry FUNCTION CALLED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('========================================\n\n');

  try {
    const { productId, name, email, phone, size, sizes, description } =
      req.body;

    console.log('Extracted fields:', {
      productId,
      name,
      email,
      phone,
      size,
      sizes,
      description,
    });

    if (!productId || !name || !email || !phone) {
      req.flash('error', 'Please fill in all required fields');
      return res.redirect('/?error=inquiry');
    }

    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/?error=inquiry');
    }

    // Handle sizes - can be array (sizes[]) or single value (size)
    let sizesArray = [];
    if (sizes) {
      sizesArray = Array.isArray(sizes) ? sizes : [sizes];
    } else if (size) {
      sizesArray = [size];
    }

    // Create inquiry
    const inquiryData = {
      type: 'product',
      product: productId,
      productName: product.name,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      description: (description || '').trim(),
    };

    // Add sizes - use sizes array if available, otherwise use size for backwards compatibility
    if (sizesArray.length > 0) {
      inquiryData.sizes = sizesArray.filter((s) => s && s.trim());
      // Also set size for backwards compatibility (first size or empty)
      inquiryData.size = sizesArray[0] || '';
    } else {
      inquiryData.size = (size || '').trim();
      inquiryData.sizes = [];
    }

    // Validate required fields before saving
    if (!inquiryData.name || !inquiryData.email || !inquiryData.phone) {
      console.error(
        'ERROR: Missing required fields after processing:',
        inquiryData,
      );
      req.flash('error', 'Missing required fields');
      return res.redirect('/?error=inquiry');
    }

    // Save inquiry to database
    let inquiry;
    try {
      console.log(
        'Attempting to save inquiry with data:',
        JSON.stringify(inquiryData, null, 2),
      );
      inquiry = await Inquiry.create(inquiryData);
      console.log('Inquiry created successfully:', inquiry._id);
      console.log('Inquiry details:', {
        _id: inquiry._id,
        type: inquiry.type,
        name: inquiry.name,
        email: inquiry.email,
        product: inquiry.product,
        createdAt: inquiry.createdAt,
      });

      // Verify it was actually saved by querying it back
      const verifyInquiry = await Inquiry.findById(inquiry._id);
      if (!verifyInquiry) {
        console.error('ERROR: Inquiry was not found after creation!');
        req.flash('error', 'Failed to save inquiry. Please try again.');
        return res.redirect('/?error=inquiry');
      }
      console.log('Verified inquiry exists in database:', verifyInquiry._id);
    } catch (dbError) {
      console.error('Database error creating inquiry:', dbError);
      console.error('Error stack:', dbError.stack);
      // Log detailed validation errors
      if (dbError.name === 'ValidationError') {
        const validationErrors = Object.values(dbError.errors).map(
          (err) => err.message,
        );
        console.error('Validation errors:', validationErrors);
        req.flash('error', `Validation error: ${validationErrors.join(', ')}`);
      } else {
        req.flash('error', 'Failed to save inquiry. Please try again.');
      }
      return res.redirect('/?error=inquiry');
    }

    // Send email notification (don't fail if email fails, data is already saved)
    console.log('Attempting to send product inquiry email...');
    try {
      const transporter = createEmailTransporter();
      if (transporter) {
        const to =
          process.env.CONTACT_RECEIVER ||
          process.env.SITE_EMAIL ||
          'Aquarianpoolandspa@gmail.com';
        const from = process.env.FROM_EMAIL || process.env.SMTP_USER;
        const emailSubject = `New Product Inquiry: ${product.name}`;
        const emailBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px">
            <h2 style="color:#0d6efd;border-bottom:2px solid #e9ecef;padding-bottom:8px">New Product Inquiry</h2>
            <p><strong>Product:</strong> ${product.name}</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            ${
              sizesArray.length > 0
                ? `<p><strong>Selected Sizes:</strong> ${sizesArray.join(
                    ', ',
                  )}</p>`
                : size
                ? `<p><strong>Size:</strong> ${size}</p>`
                : ''
            }
            ${
              description
                ? `<div><strong>Message:</strong><br><div style="background:#f8f9fa;border-left:4px solid #0d6efd;padding:12px">${description.replace(
                    /\n/g,
                    '<br>',
                  )}</div></div>`
                : ''
            }
            <p style="color:#6c757d;font-size:12px;margin-top:12px">Submitted: ${new Date().toLocaleString()}</p>
          </div>
        `;

        console.log('Sending email to:', to);
        console.log('From:', from);
        console.log('Subject:', emailSubject);

        const emailResult = await transporter.sendMail({
          from,
          to,
          subject: emailSubject,
          html: emailBody,
        });

        console.log('Email sent successfully!', emailResult.messageId);
      } else {
        console.warn('Email disabled. Missing SMTP_USER/SMTP_PASS');
        console.warn('SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'Not set');
        console.warn('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
      }
    } catch (emailErr) {
      console.error('=== ERROR sending product inquiry email ===');
      console.error('Error:', emailErr);
      console.error('Error message:', emailErr.message);
      console.error('Error stack:', emailErr.stack);
      // Don't fail the request if email fails, data is already saved
    }

    console.log('=== Inquiry process completed successfully ===');
    req.flash('success', 'Thank you! We will be in touch shortly.');
    res.redirect('/?submitted=inquiry');
  } catch (e) {
    console.error('=== ERROR in createProductInquiry ===');
    console.error('Error creating product inquiry:', e);
    console.error('Error stack:', e.stack);
    // Log validation errors in detail
    if (e.name === 'ValidationError') {
      const errors = Object.values(e.errors)
        .map((err) => err.message)
        .join(', ');
      console.error('Validation errors:', errors);
      req.flash('error', `Validation error: ${errors}`);
    } else {
      req.flash(
        'error',
        e.message || 'Error submitting inquiry. Please try again.',
      );
    }
    res.redirect('/?error=inquiry');
  }
};

// Public endpoint for general contact form submission
exports.createContactInquiry = async (req, res) => {
  console.log('\n\n========================================');
  console.log('=== createContactInquiry FUNCTION CALLED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('========================================\n\n');

  try {
    const { name, town, phoneNumber, email, projectType, message, honey } =
      req.body;

    console.log('Extracted fields:', {
      name,
      town,
      phoneNumber,
      email,
      projectType,
      message: message ? 'has message' : 'no message',
      honey: honey ? 'has honey' : 'no honey',
    });

    // Simple anti-spam: hidden field must be blank
    if (honey && honey.trim() !== '') {
      req.flash('error', 'Spam detected');
      return res.redirect('/?error=contact');
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
      return res.redirect('/?error=contact');
    }

    // Save to Contact model
    console.log('Attempting to save contact to database...');
    let contact;
    try {
      contact = await Contact.create({
        name,
        town,
        phoneNumber,
        email,
        projectType,
        message: message || '',
      });
      console.log('Contact created successfully:', contact._id);
      console.log('Contact details:', {
        _id: contact._id,
        name: contact.name,
        email: contact.email,
        createdAt: contact.createdAt,
      });

      // Verify it was saved
      const verifyContact = await Contact.findById(contact._id);
      if (!verifyContact) {
        console.error('ERROR: Contact was not found after creation!');
      } else {
        console.log('Verified contact exists in database:', verifyContact._id);
      }
    } catch (dbError) {
      console.error('=== DATABASE ERROR saving contact ===');
      console.error('Error:', dbError);
      console.error('Error name:', dbError.name);
      console.error('Error message:', dbError.message);
      if (dbError.name === 'ValidationError') {
        const validationErrors = Object.values(dbError.errors).map(
          (err) => err.message,
        );
        console.error('Validation errors:', validationErrors);
        req.flash('error', `Validation error: ${validationErrors.join(', ')}`);
      } else {
        req.flash('error', 'Failed to save contact. Please try again.');
      }
      return res.redirect('/?error=contact');
    }

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

    req.flash('success', 'Thank you! We will be in touch shortly.');
    res.redirect('/?submitted=contact');
  } catch (e) {
    console.error('Error creating contact inquiry:', e);
    req.flash(
      'error',
      e.message || 'Error submitting inquiry. Please try again.',
    );
    res.redirect('/?error=contact');
  }
};
