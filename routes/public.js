const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { getGridFSBucket } = require('../utils/gridfs');
const mongoose = require('mongoose');

router.get('/', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/portfolio', publicController.getPortfolio);
router.get('/portfolio/:slug', publicController.getProjectDetail);
router.get('/contact', publicController.getContact);
router.post('/contact', publicController.postContact);

// Serve images from GridFS
router.get('/api/images/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getGridFSBucket();

    // Check if file exists
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).send('Image not found');
    }

    const file = files[0];
    res.set({
      'Content-Type': file.metadata?.mimetype || 'image/webp',
      'Content-Length': file.length,
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    });

    // Stream file from GridFS
    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);
    downloadStream.on('error', (err) => {
      console.error('Error streaming image:', err);
      if (!res.headersSent) {
        res.status(500).send('Error loading image');
      }
    });
  } catch (error) {
    console.error('Error serving image:', error);
    if (!res.headersSent) {
      res.status(500).send('Error loading image');
    }
  }
});

module.exports = router;
