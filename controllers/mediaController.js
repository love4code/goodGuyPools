const Media = require('../models/Media')
const { deleteFromGridFS } = require('../utils/gridfs')
const mongoose = require('mongoose')

exports.list = async (req, res) => {
  const { q = '', page = 1 } = req.query
  const perPage = 24
  const filter = q ? { $or: [{ title: new RegExp(q, 'i') }, { tags: q }] } : {}
  const total = await Media.countDocuments(filter)
  const items = await Media.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage)
  res.render('admin/media', {
    title: 'Media Library',
    items,
    q,
    total,
    page: Number(page),
    perPage
  })
}

exports.upload = async (req, res) => {
  try {
    if (!req.file || !req.file.gridfsId) {
      req.flash('error', 'Please select an image to upload')
      return res.redirect('/admin/media')
    }
    await Media.create({
      gridfsId: req.file.gridfsId,
      filePath: req.file.path, // /api/images/{gridfsId}
      originalFilename: req.file.originalname,
      title: req.body.title || '',
      altText: req.body.altText || '',
      tags: req.body.tags
        ? req.body.tags
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : []
    })
    req.flash('success', 'Image uploaded')
    res.redirect('/admin/media')
  } catch (e) {
    req.flash('error', e.message)
    res.redirect('/admin/media')
  }
}

exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      req.flash('error', 'Please select images to upload')
      return res.redirect('/admin/media')
    }
    const titles = (req.body.title || '').trim()
    const altText = (req.body.altText || '').trim()
    const tags = req.body.tags
      ? req.body.tags
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : []

    for (const f of req.files) {
      if (!f.gridfsId) continue // Skip if GridFS upload failed
      await Media.create({
        gridfsId: f.gridfsId,
        filePath: f.path, // /api/images/{gridfsId}
        originalFilename: f.originalname,
        title: titles || '',
        altText: altText || '',
        tags
      })
    }
    req.flash('success', `${req.files.length} image(s) uploaded`)
    res.redirect('/admin/media')
  } catch (e) {
    req.flash('error', e.message)
    res.redirect('/admin/media')
  }
}

exports.remove = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
    if (!media) {
      req.flash('error', 'Not found')
      return res.redirect('/admin/media')
    }
    // Delete from GridFS
    if (media.gridfsId) {
      await deleteFromGridFS(media.gridfsId)
    }
    await Media.findByIdAndDelete(req.params.id)
    req.flash('success', 'Deleted')
    res.redirect('/admin/media')
  } catch (e) {
    req.flash('error', e.message)
    res.redirect('/admin/media')
  }
}

exports.apiList = async (req, res) => {
  const items = await Media.find().sort({ createdAt: -1 })
  res.json(items)
}

exports.editForm = async (req, res) => {
  const media = await Media.findById(req.params.id)
  if (!media) {
    req.flash('error', 'Media not found')
    return res.redirect('/admin/media')
  }
  res.render('admin/media-edit', { title: 'Edit Media', media })
}

exports.update = async (req, res) => {
  try {
    const { title, altText, tags } = req.body
    const update = {
      title: (title || '').trim(),
      altText: (altText || '').trim(),
      tags: tags
        ? tags
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : []
    }
    await Media.findByIdAndUpdate(req.params.id, update, {
      runValidators: true
    })
    req.flash('success', 'Media updated')
    res.redirect('/admin/media')
  } catch (e) {
    req.flash('error', e.message)
    res.redirect(`/admin/media/${req.params.id}/edit`)
  }
}
