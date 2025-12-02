const Service = require('../models/Service');
const slugify = require('slugify');

exports.list = async (req, res) => {
  const services = await Service.find().sort({ order: 1, createdAt: 1 });
  res.render('admin/services', { title: 'Services', services });
};

exports.newForm = (req, res) => {
  res.render('admin/service-form', { title: 'New Service', service: null });
};

exports.create = async (req, res) => {
  try {
    const { title, description, order, icon } = req.body;
    if (!icon || !icon.trim()) {
      req.flash('error', 'Icon is required');
      return res.redirect('/admin/services/new');
    }
    const slug =
      slugify(title || '', { lower: true, strict: true }) || undefined;
    await Service.create({
      title,
      description,
      icon: icon.trim(),
      order: Number(order) || 0,
      slug,
    });
    req.flash('success', 'Service created');
    res.redirect('/admin/services');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/services/new');
  }
};

exports.editForm = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    req.flash('error', 'Service not found');
    return res.redirect('/admin/services');
  }
  res.render('admin/service-form', { title: 'Edit Service', service });
};

exports.update = async (req, res) => {
  try {
    const { title, description, order, icon } = req.body;
    if (!icon || !icon.trim()) {
      req.flash('error', 'Icon is required');
      return res.redirect(`/admin/services/${req.params.id}/edit`);
    }
    const update = {
      title,
      description,
      icon: icon.trim(),
      order: Number(order) || 0,
      updatedAt: new Date(),
    };
    await Service.findByIdAndUpdate(req.params.id, update, {
      runValidators: true,
    });
    req.flash('success', 'Service updated');
    res.redirect('/admin/services');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/admin/services/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  req.flash('success', 'Service deleted');
  res.redirect('/admin/services');
};
