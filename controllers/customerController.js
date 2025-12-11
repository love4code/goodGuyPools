const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

exports.list = async (req, res) => {
  const { page = 1, search = '' } = req.query;
  const perPage = 20;
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  const total = await Customer.countDocuments(filter);
  const customers = await Customer.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  res.render('admin/customers', {
    title: 'Customers',
    customers,
    total,
    page: Number(page),
    perPage,
    search,
  });
};

exports.newForm = (req, res) => {
  res.render('admin/customer-form', { title: 'New Customer', customer: null });
};

exports.create = async (req, res) => {
  try {
    const { name, email, phone, address, city, state, zipCode, notes } =
      req.body;
    await Customer.create({
      name,
      email: email || '',
      phone: phone || '',
      address: address || '',
      city: city || '',
      state: state || '',
      zipCode: zipCode || '',
      notes: notes || '',
    });
    req.flash('success', 'Customer created');
    res.redirect('/admin/customers');
  } catch (e) {
    console.error('Error creating customer:', e);
    req.flash('error', e.message || 'Error creating customer');
    res.render('admin/customer-form', {
      title: 'New Customer',
      customer: req.body,
      error: e.message,
    });
  }
};

exports.detail = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    req.flash('error', 'Customer not found');
    return res.redirect('/admin/customers');
  }
  const sales = await Sale.find({ customer: customer._id })
    .populate('product', 'name slug')
    .populate('lineItems.product', 'name slug')
    .sort({ saleDate: -1 });
  res.render('admin/customer-detail', {
    title: 'Customer Detail',
    customer,
    sales,
  });
};

exports.editForm = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    req.flash('error', 'Customer not found');
    return res.redirect('/admin/customers');
  }
  res.render('admin/customer-form', {
    title: 'Edit Customer',
    customer,
  });
};

exports.update = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/admin/customers');
    }
    const { name, email, phone, address, city, state, zipCode, notes } =
      req.body;
    customer.name = name;
    customer.email = email || '';
    customer.phone = phone || '';
    customer.address = address || '';
    customer.city = city || '';
    customer.state = state || '';
    customer.zipCode = zipCode || '';
    customer.notes = notes || '';
    customer.updatedAt = new Date();
    await customer.save();
    req.flash('success', 'Customer updated');
    res.redirect(`/admin/customers/${customer._id}`);
  } catch (e) {
    req.flash('error', e.message || 'Error updating customer');
    res.redirect(`/admin/customers/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    req.flash('error', 'Customer not found');
    return res.redirect('/admin/customers');
  }
  // Check if customer has sales
  const salesCount = await Sale.countDocuments({ customer: customer._id });
  if (salesCount > 0) {
    req.flash(
      'error',
      'Cannot delete customer with existing sales. Delete sales first.',
    );
    return res.redirect(`/admin/customers/${customer._id}`);
  }
  await Customer.findByIdAndDelete(req.params.id);
  req.flash('success', 'Customer deleted');
  res.redirect('/admin/customers');
};
