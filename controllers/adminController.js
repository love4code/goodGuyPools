const AdminUser = require('../models/AdminUser');
const Project = require('../models/Project');
const Contact = require('../models/Contact');
const ProductQuote = require('../models/ProductQuote');
const Inquiry = require('../models/Inquiry');
const Product = require('../models/Product');
const Service = require('../models/Service');
const Media = require('../models/Media');
const PageView = require('../models/PageView');
const SiteSettings = require('../models/SiteSettings');

exports.getLogin = (req, res) => {
  if (req.session.userId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin Login' });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    req.flash('error', 'Email and password are required');
    return res.redirect('/admin/login');
  }
  const user = await AdminUser.findOne({ email });
  if (!user) {
    req.flash('error', 'Invalid credentials');
    return res.redirect('/admin/login');
  }
  const ok = await user.verifyPassword(password);
  if (!ok) {
    req.flash('error', 'Invalid credentials');
    return res.redirect('/admin/login');
  }
  req.session.userId = user._id.toString();
  // Save session before redirecting to ensure it's persisted
  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      req.flash('error', 'Login failed. Please try again.');
      return res.redirect('/admin/login');
    }
    req.flash('success', 'Welcome back!');
    res.redirect('/admin');
  });
};

exports.getLogout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

exports.getDashboard = async (req, res) => {
  const productCount = await Product.countDocuments();
  const projectCount = await Project.countDocuments();
  const serviceCount = await Service.countDocuments();
  const mediaCount = await Media.countDocuments();
  const inquiryCount = await Inquiry.countDocuments();
  const recentInquiries = await Inquiry.find()
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .limit(5);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats: {
      productCount,
      projectCount,
      serviceCount,
      mediaCount,
      inquiryCount,
    },
    recentInquiries,
  });
};
