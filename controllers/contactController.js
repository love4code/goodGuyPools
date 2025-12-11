const Contact = require('../models/Contact');

exports.list = async (req, res) => {
  console.log('\n\n=== contacts.list FUNCTION CALLED ===');
  console.log('Time:', new Date().toISOString());
  console.log('Query params:', req.query);

  const { type = '', read = '', page = 1 } = req.query;
  const perPage = 20;
  const filter = {};
  if (type) filter.projectType = type;
  if (read === 'true') filter.isRead = true;
  if (read === 'false') filter.isRead = false;

  console.log('Filter:', filter);

  const total = await Contact.countDocuments(filter);
  console.log('Total contacts with filter:', total);

  const allContacts = await Contact.find({}).sort({ createdAt: -1 }).limit(5);
  console.log('Recent contacts (no filter, limit 5):', allContacts.length);
  if (allContacts.length > 0) {
    console.log('Most recent contact:', {
      _id: allContacts[0]._id,
      name: allContacts[0].name,
      email: allContacts[0].email,
      createdAt: allContacts[0].createdAt,
    });
  }

  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  console.log('Contacts found with filter:', contacts.length);
  console.log('========================================\n\n');

  res.render('admin/contacts', {
    title: 'Contacts',
    contacts,
    total,
    page: Number(page),
    perPage,
    type,
    read,
  });
};

exports.detail = async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) {
    req.flash('error', 'Inquiry not found');
    return res.redirect('/admin/contacts');
  }
  res.render('admin/contact-detail', { title: 'Inquiry Detail', contact });
};

exports.toggleRead = async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (contact) {
    contact.isRead = !contact.isRead;
    await contact.save();
  }
  res.redirect('/admin/contacts');
};

exports.remove = async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  req.flash('success', 'Inquiry deleted');
  res.redirect('/admin/contacts');
};
