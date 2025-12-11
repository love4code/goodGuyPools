const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const productController = require('../controllers/productController');
const inquiryController = require('../controllers/inquiryController');

router.get('/', publicController.getHome);
router.get('/about', publicController.getAbout);
router.get('/portfolio', publicController.getPortfolio);
router.get('/portfolio/:slug', publicController.getProjectDetail);
router.get('/contact', publicController.getContact);
router.post('/contact', inquiryController.createContactInquiry);

// Products
router.get('/products', productController.publicList);
router.get('/products/:slug', productController.publicDetail);

// Log all POST requests to inquiry route
router.post(
  '/products/:slug/inquiry',
  (req, res, next) => {
    console.log('\n\n=== ROUTE HIT: /products/:slug/inquiry ===');
    console.log('Slug:', req.params.slug);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('==========================================\n\n');
    next();
  },
  inquiryController.createProductInquiry,
);

module.exports = router;
