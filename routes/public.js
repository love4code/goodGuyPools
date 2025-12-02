const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const productController = require('../controllers/productController');
const { getGridFSBucket } = require('../utils/gridfs');
const mongoose = require('mongoose');

router.get('/', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/portfolio', publicController.getPortfolio);
router.get('/portfolio/:slug', publicController.getProjectDetail);
router.get('/contact', publicController.getContact);
router.post('/contact', publicController.postContact);

// Products
router.get('/products', productController.publicList);
router.get('/products/:slug', productController.publicDetail);
router.post('/products/quote', productController.requestQuote);

// Serve images from GridFS
router.get('/api/images/:id', async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error('Invalid ObjectId format:', req.params.id);
      return res.status(400).send('Invalid image ID format');
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const bucket = getGridFSBucket();

    // Check if file exists
    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      console.error('Image not found in GridFS:', req.params.id);
      return res.status(404).send('Image not found');
    }

    const file = files[0];
    
    // Determine content type from metadata or filename
    let contentType = file.metadata?.mimetype || 'image/webp';
    if (!contentType || contentType === 'application/octet-stream') {
      // Try to infer from filename
      const filename = file.filename || '';
      if (filename.endsWith('.png')) contentType = 'image/png';
      else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (filename.endsWith('.gif')) contentType = 'image/gif';
      else if (filename.endsWith('.webp')) contentType = 'image/webp';
      else if (filename.endsWith('.svg')) contentType = 'image/svg+xml';
    }

    res.set({
      'Content-Type': contentType,
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
    console.error('Image ID:', req.params.id);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).send('Error loading image');
    }
  }
});

module.exports = router;
