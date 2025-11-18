const AdminUser = require('../models/AdminUser');
const Project = require('../models/Project');
const Contact = require('../models/Contact');
const ProductQuote = require('../models/ProductQuote');
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
  req.flash('success', 'Welcome back!');
  res.redirect('/admin');
};

exports.getLogout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

exports.getDashboard = async (req, res) => {
  const projectCount = await Project.countDocuments();
  const contactCount = await Contact.countDocuments();
  const unreadContactCount = await Contact.countDocuments({ isRead: false });
  const productQuoteCount = await ProductQuote.countDocuments();
  const unreadProductQuoteCount = await ProductQuote.countDocuments({
    isRead: false,
  });
  const recentContacts = await Contact.find().sort({ createdAt: -1 }).limit(5);
  const recentProductQuotes = await ProductQuote.find()
    .populate('productId', 'name slug')
    .sort({ createdAt: -1 })
    .limit(10);

  const totalViews = await PageView.countDocuments();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const last30 = await PageView.aggregate([
    { $match: { timestamp: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const topPages = await PageView.aggregate([
    { $group: { _id: '$path', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 3 },
  ]);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats: {
      projectCount,
      contactCount,
      unreadContactCount,
      productQuoteCount,
      unreadProductQuoteCount,
      totalViews,
      last30,
      topPages,
    },
    recentContacts,
    recentProductQuotes,
  });
};
