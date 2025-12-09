const Project = require('../models/Project');
const Contact = require('../models/Contact');
const SiteSettings = require('../models/SiteSettings');
const Service = require('../models/Service');
const Product = require('../models/Product');
const { sendContactEmail } = require('../utils/email');

async function getSettings () {
  const settings = await SiteSettings.findOne()
    .populate('navbarLogo')
    .populate('heroLogo')
    .populate('heroBackgroundImage');
  return (
    settings || {
      companyName: 'Good Guy Pools',
      phone: '401-332-9183',
      email: '',
      social: {},
    }
  );
}

exports.getHome = async (req, res) => {
  try {
    const siteSettings = await getSettings();
    const services = await Service.find().sort({ order: 1, createdAt: 1 });
    const projects = await Project.find({ isFeatured: true })
      .populate('images')
      .sort({ createdAt: -1 })
      .limit(4);
    const products = await Product.find({ isActive: true })
      .populate('mainImage')
      .sort({ order: 1, createdAt: -1 })
      .limit(6);
    res.render('index', {
      title: 'Home',
      siteSettings,
      services,
      projects,
      products,
      errors: null,
      success: false,
    });
  } catch (e) {
    res.render('index', {
      title: 'Home',
      siteSettings: await getSettings(),
      services: [],
      projects: [],
      products: [],
      errors: null,
      success: false,
    });
  }
};

exports.getAbout = async (req, res) => {
  const siteSettings = await getSettings();
  res.render('about', { title: 'About', siteSettings });
};

exports.getPortfolio = async (req, res) => {
  const siteSettings = await getSettings();
  const { type, status, page = 1 } = req.query;
  const filter = {};
  if (type) filter.projectType = type;
  if (status) filter.status = status;
  const perPage = 12;
  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .populate('images')
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  res.render('portfolio', {
    title: 'Portfolio',
    siteSettings,
    projects,
    total,
    page: Number(page),
    perPage,
    type: type || 'all',
    status: status || 'all',
  });
};

exports.getProjectDetail = async (req, res) => {
  const siteSettings = await getSettings();
  const project = await Project.findOne({ slug: req.params.slug }).populate(
    'images',
  );
  if (!project)
    return res
      .status(404)
      .render('error', { title: 'Not Found', error: 'Project not found' });
  res.render('project-detail', { title: project.title, siteSettings, project });
};

exports.getContact = async (req, res) => {
  const siteSettings = await getSettings();
  res.render('contact', {
    title: 'Contact',
    siteSettings,
    form: {},
    errors: null,
    success: false,
  });
};

exports.postContact = async (req, res) => {
  const siteSettings = await getSettings();
  const { name, town, phoneNumber, email, projectType, message, honey } =
    req.body;
  const form = { name, town, phoneNumber, email, projectType, message };
  const errors = [];
  // simple anti-spam: hidden field must be blank
  if (honey && honey.trim() !== '') {
    return res.render('contact', {
      title: 'Contact',
      siteSettings,
      form,
      errors: ['Spam detected'],
      success: false,
    });
  }
  if (!name) errors.push('Name is required');
  if (!town) errors.push('Town is required');
  if (!phoneNumber) errors.push('Phone Number is required');
  if (!email) errors.push('Email is required');
  if (!projectType) errors.push('Project Type is required');
  if (errors.length) {
    return res.render('contact', {
      title: 'Contact',
      siteSettings,
      form,
      errors,
      success: false,
    });
  }
  try {
    await Contact.create({
      name,
      town,
      phoneNumber,
      email,
      projectType,
      message,
    });
    await sendContactEmail({
      name,
      town,
      phoneNumber,
      email,
      projectType,
      message,
    });
    req.flash('success', 'Thanks! Your inquiry has been received.');
    res.render('contact', {
      title: 'Contact',
      siteSettings,
      form: {},
      errors: null,
      success: true,
    });
  } catch (e) {
    res.render('contact', {
      title: 'Contact',
      siteSettings,
      form,
      errors: ['Failed to submit. Please try again.'],
      success: false,
    });
  }
};
