const Media = require('../models/Media');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { getGridFSBucket, deleteFromGridFS } = require('../utils/gridfs');

exports.list = async (req, res) => {
  const { q = '', page = 1 } = req.query;
  const perPage = 24;
  const filter = q ? { $or: [{ title: new RegExp(q, 'i') }, { tags: q }] } : {};
  const total = await Media.countDocuments(filter);
  const items = await Media.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  res.render('admin/media', {
    title: 'Media Library',
    items,
    q,
    total,
    page: Number(page),
    perPage,
  });
};

exports.upload = async (req, res) => {
  try {
    if (!req.file || !req.file.mediaId) {
      req.flash('error', 'Please select an image to upload');
      return res.redirect('/admin/media');
    }
    await Media.create({
      _id: req.file.mediaId,
      originalFilename: req.file.originalname,
      title: req.body.title || '',
      altText: req.body.altText || '',
      tags: req.body.tags
        ? req.body.tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      sizes: req.file.sizes || {}, // Store all size references
    });
    req.flash('success', 'Image uploaded');
    res.redirect('/admin/media');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/media');
  }
};

exports.uploadMultiple = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      req.flash('error', 'Please select images to upload');
      return res.redirect('/admin/media');
    }
    const titles = (req.body.title || '').trim();
    const altText = (req.body.altText || '').trim();
    const tags = req.body.tags
      ? req.body.tags
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    for (const f of req.files) {
      if (!f.mediaId) continue; // Skip if upload failed
      await Media.create({
        _id: f.mediaId,
        originalFilename: f.originalname,
        title: titles || '',
        altText: altText || '',
        tags,
        sizes: f.sizes || {}, // Store all size references
      });
    }
    req.flash('success', `${req.files.length} image(s) uploaded`);
    res.redirect('/admin/media');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/media');
  }
};

exports.remove = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      req.flash('error', 'Not found');
      return res.redirect('/admin/media');
    }
    // Delete all files from GridFS
    if (media.sizes) {
      if (media.sizes.thumbnail?.fileId) {
        await deleteFromGridFS(media.sizes.thumbnail.fileId);
      }
      if (media.sizes.medium?.fileId) {
        await deleteFromGridFS(media.sizes.medium.fileId);
      }
      if (media.sizes.large?.fileId) {
        await deleteFromGridFS(media.sizes.large.fileId);
      }
    }
    await Media.findByIdAndDelete(req.params.id);
    req.flash('success', 'Deleted');
    res.redirect('/admin/media');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/media');
  }
};

exports.bulkRemove = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      req.flash('error', 'No images selected');
      return res.redirect('/admin/media');
    }

    // Validate all IDs are valid MongoDB ObjectIds
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validIds.length === 0) {
      req.flash('error', 'Invalid image IDs');
      return res.redirect('/admin/media');
    }

    let deletedCount = 0;
    let errorCount = 0;

    // Delete each media item and its files
    for (const id of validIds) {
      try {
        const media = await Media.findById(id);
        if (media) {
          // Delete all files from GridFS
          if (media.sizes) {
            if (media.sizes.thumbnail?.fileId) {
              await deleteFromGridFS(media.sizes.thumbnail.fileId);
            }
            if (media.sizes.medium?.fileId) {
              await deleteFromGridFS(media.sizes.medium.fileId);
            }
            if (media.sizes.large?.fileId) {
              await deleteFromGridFS(media.sizes.large.fileId);
            }
          }

          await Media.findByIdAndDelete(id);
          deletedCount++;
        }
      } catch (err) {
        console.error(`Error deleting media ${id}:`, err);
        errorCount++;
      }
    }

    if (errorCount > 0) {
      req.flash(
        'error',
        `Deleted ${deletedCount} image(s), ${errorCount} error(s)`,
      );
    } else {
      req.flash('success', `Deleted ${deletedCount} image(s)`);
    }

    res.redirect('/admin/media');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect('/admin/media');
  }
};

exports.apiList = async (req, res) => {
  const { q = '' } = req.query;
  const filter = q
    ? {
        $or: [
          { title: new RegExp(q, 'i') },
          { originalFilename: new RegExp(q, 'i') },
          { tags: { $in: [new RegExp(q, 'i')] } },
        ],
      }
    : {};
  const items = await Media.find(filter).sort({ createdAt: -1 });
  res.json(items);
};

exports.editForm = async (req, res) => {
  const media = await Media.findById(req.params.id);
  if (!media) {
    req.flash('error', 'Media not found');
    return res.redirect('/admin/media');
  }
  res.render('admin/media-edit', { title: 'Edit Media', media });
};

exports.update = async (req, res) => {
  try {
    const { title, altText, tags } = req.body;
    const update = {
      title: (title || '').trim(),
      altText: (altText || '').trim(),
      tags: tags
        ? tags
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    await Media.findByIdAndUpdate(req.params.id, update, {
      runValidators: true,
    });
    req.flash('success', 'Media updated');
    res.redirect('/admin/media');
  } catch (e) {
    req.flash('error', e.message);
    res.redirect(`/admin/media/${req.params.id}/edit`);
  }
};

exports.serveImage = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).send('Invalid file ID');
    }

    const bucket = getGridFSBucket();
    const fileIdObj = new mongoose.Types.ObjectId(fileId);

    // Check if file exists
    const files = await bucket.find({ _id: fileIdObj }).toArray();
    if (files.length === 0) {
      return res.status(404).send('File not found');
    }

    const file = files[0];

    // Set appropriate headers
    res.set({
      'Content-Type': file.contentType || 'image/webp',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    });

    // Stream the file
    const downloadStream = bucket.openDownloadStream(fileIdObj);
    downloadStream.pipe(res);

    downloadStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).send('Error streaming file');
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    if (!res.headersSent) {
      res.status(500).send('Error serving image');
    }
  }
};
