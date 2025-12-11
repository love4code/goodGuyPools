const mongoose = require('mongoose');
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
const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

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
  const customerCount = await Customer.countDocuments();
  const saleCount = await Sale.countDocuments();
  const totalSalesAmount = await Sale.aggregate([
    {
      $addFields: {
        normalizedTotal: { $ifNull: ['$total', '$amount'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$normalizedTotal' } } },
  ]);
  const paidSalesAmount = await Sale.aggregate([
    { $match: { isPaid: true } },
    {
      $addFields: {
        normalizedTotal: { $ifNull: ['$total', '$amount'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$normalizedTotal' } } },
  ]);
  const unpaidSalesAmount = await Sale.aggregate([
    { $match: { isPaid: false } },
    {
      $addFields: {
        normalizedTotal: { $ifNull: ['$total', '$amount'] },
      },
    },
    { $group: { _id: null, total: { $sum: '$normalizedTotal' } } },
  ]);
  const recentInquiries = await Inquiry.find()
    .populate('product', 'name slug')
    .sort({ createdAt: -1 })
    .limit(5);
  const recentSales = await Sale.find()
    .populate('customer', 'name')
    .populate('product', 'name')
    .populate('lineItems.product', 'name')
    .sort({ saleDate: -1 })
    .limit(5);

  // Get all customers and sales for filter dropdowns
  const customers = await Customer.find().sort({ name: 1 }).select('_id name');
  const allSales = await Sale.find()
    .sort({ saleDate: -1 })
    .select('_id saleDate customer')
    .populate('customer', 'name')
    .limit(100);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    stats: {
      productCount,
      projectCount,
      serviceCount,
      mediaCount,
      inquiryCount,
      customerCount,
      saleCount,
      totalSalesAmount: totalSalesAmount[0]?.total || 0,
      paidSalesAmount: paidSalesAmount[0]?.total || 0,
      unpaidSalesAmount: unpaidSalesAmount[0]?.total || 0,
    },
    recentInquiries,
    recentSales,
    customers,
    allSales,
  });
};

// API endpoint for profit data by month
exports.getProfitByMonth = async (req, res) => {
  try {
    const { customerId, saleId, year } = req.query;

    const matchStage = {};
    if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
    if (saleId) matchStage._id = mongoose.Types.ObjectId(saleId);
    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31T23:59:59`);
      matchStage.saleDate = { $gte: startDate, $lte: endDate };
    }

    const profitData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$saleDate' },
            month: { $month: '$saleDate' },
          },
          totalProfit: { $sum: { $ifNull: ['$profit', 0] } },
          saleCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json(profitData);
  } catch (error) {
    console.error('Error fetching profit by month:', error);
    res.status(500).json({ error: error.message });
  }
};

// API endpoint for profit data by year
exports.getProfitByYear = async (req, res) => {
  try {
    const { customerId, saleId } = req.query;

    const matchStage = {};
    if (customerId) matchStage.customer = mongoose.Types.ObjectId(customerId);
    if (saleId) matchStage._id = mongoose.Types.ObjectId(saleId);

    const profitData = await Sale.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $year: '$saleDate' },
          totalProfit: { $sum: { $ifNull: ['$profit', 0] } },
          saleCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(profitData);
  } catch (error) {
    console.error('Error fetching profit by year:', error);
    res.status(500).json({ error: error.message });
  }
};
