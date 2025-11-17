const Contact = require('../models/Contact')

exports.list = async (req, res) => {
  const { type = '', read = '', page = 1 } = req.query
  const perPage = 20
  const filter = {}
  if (type) filter.projectType = type
  if (read === 'true') filter.isRead = true
  if (read === 'false') filter.isRead = false
  const total = await Contact.countDocuments(filter)
  const contacts = await Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage)
  res.render('admin/contacts', { title: 'Contacts', contacts, total, page: Number(page), perPage, type, read })
}

exports.detail = async (req, res) => {
  const contact = await Contact.findById(req.params.id)
  if (!contact) {
    req.flash('error', 'Inquiry not found')
    return res.redirect('/admin/contacts')
  }
  res.render('admin/contact-detail', { title: 'Inquiry Detail', contact })
}

exports.toggleRead = async (req, res) => {
  const contact = await Contact.findById(req.params.id)
  if (contact) {
    contact.isRead = !contact.isRead
    await contact.save()
  }
  res.redirect('/admin/contacts')
}

exports.remove = async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id)
  req.flash('success', 'Inquiry deleted')
  res.redirect('/admin/contacts')
}


