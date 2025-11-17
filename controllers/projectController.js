const Project = require('../models/Project')
const Media = require('../models/Media')

exports.list = async (req, res) => {
  const { q = '', type = '', status = '', featured = '', page = 1 } = req.query
  const perPage = 20
  const filter = {}
  if (q) filter.title = new RegExp(q, 'i')
  if (type) filter.projectType = type
  if (status) filter.status = status
  if (featured === 'true') filter.isFeatured = true
  const total = await Project.countDocuments(filter)
  const projects = await Project.find(filter).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage)
  res.render('admin/projects', { title: 'Projects', projects, total, page: Number(page), perPage, q, type, status, featured })
}

exports.newForm = async (req, res) => {
  res.render('admin/project-form', { title: 'New Project', project: null })
}

exports.create = async (req, res) => {
  try {
    const data = {
      title: req.body.title,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      projectType: req.body.projectType,
      location: req.body.location,
      featuredImage: req.body.featuredImage || '',
      gallery: Array.isArray(req.body.gallery) ? req.body.gallery : (req.body.gallery ? [req.body.gallery] : []),
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status || 'Planned',
      isFeatured: req.body.isFeatured === 'on'
    }
    await Project.create(data)
    req.flash('success', 'Project created')
    res.redirect('/admin/projects')
  } catch (e) {
    req.flash('error', e.message)
    res.redirect('/admin/projects/new')
  }
}

exports.editForm = async (req, res) => {
  const project = await Project.findById(req.params.id)
  if (!project) {
    req.flash('error', 'Project not found')
    return res.redirect('/admin/projects')
  }
  res.render('admin/project-form', { title: 'Edit Project', project })
}

exports.update = async (req, res) => {
  try {
    const update = {
      title: req.body.title,
      shortDescription: req.body.shortDescription,
      description: req.body.description,
      projectType: req.body.projectType,
      location: req.body.location,
      featuredImage: req.body.featuredImage || '',
      gallery: Array.isArray(req.body.gallery) ? req.body.gallery : (req.body.gallery ? [req.body.gallery] : []),
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status || 'Planned',
      isFeatured: req.body.isFeatured === 'on',
      updatedAt: new Date()
    }
    await Project.findByIdAndUpdate(req.params.id, update, { runValidators: true })
    req.flash('success', 'Project updated')
    res.redirect('/admin/projects')
  } catch (e) {
    req.flash('error', e.message)
    res.redirect(`/admin/projects/${req.params.id}/edit`)
  }
}

exports.remove = async (req, res) => {
  await Project.findByIdAndDelete(req.params.id)
  req.flash('success', 'Project deleted')
  res.redirect('/admin/projects')
}


