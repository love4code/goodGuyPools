const Project = require('../models/Project');
const Media = require('../models/Media');
const mongoose = require('mongoose');

exports.list = async (req, res) => {
  const { q = '', type = '', status = '', featured = '', page = 1 } = req.query;
  const perPage = 20;
  const filter = {};
  if (q) filter.title = new RegExp(q, 'i');
  if (type) filter.projectType = type;
  if (status) filter.status = status;
  if (featured === 'true') filter.isFeatured = true;
  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  res.render('admin/projects', {
    title: 'Projects',
    projects,
    total,
    page: Number(page),
    perPage,
    q,
    type,
    status,
    featured,
  });
};

exports.newForm = async (req, res) => {
  res.render('admin/project-form', { title: 'New Project', project: null });
};

exports.create = async (req, res) => {
  try {
    // Process uploaded gallery images
    const uploadedGalleryIds = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mediaId) {
          // Save to Media library
          await Media.create({
            _id: file.mediaId,
            originalFilename: file.originalname,
            title: req.body.title || '',
            altText: '',
            sizes: file.sizes || {},
          });
          uploadedGalleryIds.push(file.mediaId);
        }
      }
    }

    // Process gallery from media picker (comma-separated Media IDs)
    const manualGalleryIds = [];
    if (req.body.images && req.body.images.trim() !== '') {
      const imageIds = req.body.images
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      for (const id of imageIds) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          manualGalleryIds.push(id);
        }
      }
    }

    const allGalleryIds = [...uploadedGalleryIds, ...manualGalleryIds];

    const data = {
      title: req.body.title,
      summary: req.body.shortDescription || req.body.summary,
      description: req.body.description || '',
      images: allGalleryIds,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status || 'Planned',
      isFeatured: req.body.isFeatured === 'on',
    };
    await Project.create(data);
    req.flash('success', 'Project created');
    res.redirect('/admin/projects');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/projects/new');
  }
};

exports.editForm = async (req, res) => {
  const project = await Project.findById(req.params.id).populate('images');
  if (!project) {
    req.flash('error', 'Project not found');
    return res.redirect('/admin/projects');
  }
  res.render('admin/project-form', { title: 'Edit Project', project });
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      req.flash('error', 'Project not found');
      return res.redirect('/admin/projects');
    }

    // Process uploaded gallery images
    const uploadedGalleryIds = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.mediaId) {
          // Save to Media library
          await Media.create({
            _id: file.mediaId,
            originalFilename: file.originalname,
            title: req.body.title || '',
            altText: '',
            sizes: file.sizes || {},
          });
          uploadedGalleryIds.push(file.mediaId);
        }
      }
    }

    // Process gallery from media picker (comma-separated Media IDs)
    const manualGalleryIds = [];
    if (req.body.images && req.body.images.trim() !== '') {
      const imageIds = req.body.images
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      for (const id of imageIds) {
        if (mongoose.Types.ObjectId.isValid(id)) {
          manualGalleryIds.push(id);
        }
      }
    }

    const allGalleryIds = [
      ...(project.images || []),
      ...uploadedGalleryIds,
      ...manualGalleryIds,
    ];

    const update = {
      title: req.body.title,
      summary: req.body.shortDescription || req.body.summary || '',
      description: req.body.description || '',
      images: allGalleryIds,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      status: req.body.status || 'Planned',
      isFeatured: req.body.isFeatured === 'on',
      updatedAt: new Date(),
    };
    await Project.findByIdAndUpdate(req.params.id, update, {
      runValidators: true,
    });
    req.flash('success', 'Project updated');
    res.redirect('/admin/projects');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/admin/projects/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  req.flash('success', 'Project deleted');
  res.redirect('/admin/projects');
};
