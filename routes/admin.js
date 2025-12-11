const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const mediaController = require('../controllers/mediaController');
const projectController = require('../controllers/projectController');
const contactController = require('../controllers/contactController');
const settingsController = require('../controllers/settingsController');
const { upload, processImage } = require('../middleware/upload');
const serviceController = require('../controllers/serviceController');
const productController = require('../controllers/productController');
const productQuoteController = require('../controllers/productQuoteController');
const inquiryController = require('../controllers/inquiryController');
const customerController = require('../controllers/customerController');
const saleController = require('../controllers/saleController');

// Auth
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.getLogout);

// Dashboard
router.get('/', requireAuth, adminController.getDashboard);
router.get(
  '/api/profit-by-month',
  requireAuth,
  adminController.getProfitByMonth,
);
router.get('/api/profit-by-year', requireAuth, adminController.getProfitByYear);

// Projects
router.get('/projects', requireAuth, projectController.list);
router.get('/projects/new', requireAuth, projectController.newForm);
router.post(
  '/projects',
  requireAuth,
  upload.array('galleryImages', 20),
  require('../middleware/upload').processImages,
  projectController.create,
);
router.get('/projects/:id/edit', requireAuth, projectController.editForm);
router.post(
  '/projects/:id',
  requireAuth,
  upload.array('galleryImages', 20),
  require('../middleware/upload').processImages,
  projectController.update,
);
router.post('/projects/:id/delete', requireAuth, projectController.remove);

// Contacts
router.get('/contacts', requireAuth, contactController.list);
router.get('/contacts/:id', requireAuth, contactController.detail);
router.post(
  '/contacts/:id/toggle-read',
  requireAuth,
  contactController.toggleRead,
);
router.post('/contacts/:id/delete', requireAuth, contactController.remove);

// Product Quotes
router.get('/product-quotes', requireAuth, productQuoteController.list);
router.get('/product-quotes/:id', requireAuth, productQuoteController.detail);
router.post(
  '/product-quotes/:id/toggle-read',
  requireAuth,
  productQuoteController.toggleRead,
);
router.post(
  '/product-quotes/:id/delete',
  requireAuth,
  productQuoteController.remove,
);

// Media
router.get('/media', requireAuth, mediaController.list);
router.post(
  '/media/upload',
  requireAuth,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        req.fileValidationError = err.message;
      }
      next();
    });
  },
  (req, res, next) => {
    if (req.fileValidationError || !req.file) return next();
    processImage(req, res, next);
  },
  mediaController.upload,
);
// Multi-upload endpoint
router.post(
  '/media/upload-multiple',
  requireAuth,
  upload.array('images', 20),
  require('../middleware/upload').processImages,
  mediaController.uploadMultiple,
);
// Bulk delete endpoint (must be before :id routes)
router.post('/media/bulk-delete', requireAuth, mediaController.bulkRemove);
// Serve images from GridFS (must be before :id routes)
router.get('/media/image/:fileId', mediaController.serveImage);
// API list endpoint
router.get('/media/api/list', requireAuth, mediaController.apiList);
// Edit media metadata
router.get('/media/:id/edit', requireAuth, mediaController.editForm);
router.post('/media/:id', requireAuth, mediaController.update);
router.post('/media/:id/delete', requireAuth, mediaController.remove);

// Settings
router.get('/settings', requireAuth, settingsController.getSettings);
router.post(
  '/settings',
  requireAuth,
  (req, res, next) => {
    upload.fields([
      { name: 'faviconUpload', maxCount: 1 },
      { name: 'logoUpload', maxCount: 1 },
    ])(req, res, (err) => {
      // Ignore unexpected field errors for non-file fields
      if (err && err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next();
      }
      next(err);
    });
  },
  require('../middleware/upload').processImages,
  settingsController.updateSettings,
);

// Services CRUD
router.get('/services', requireAuth, serviceController.list);
router.get('/services/new', requireAuth, serviceController.newForm);
router.post('/services', requireAuth, serviceController.create);
router.get('/services/:id/edit', requireAuth, serviceController.editForm);
router.post('/services/:id', requireAuth, serviceController.update);
router.post('/services/:id/delete', requireAuth, serviceController.remove);

// Products CRUD
router.get('/products', requireAuth, productController.list);
router.get('/products/api/list', requireAuth, productController.apiList);
router.post('/products/api/create', requireAuth, productController.apiCreate);
router.get('/products/new', requireAuth, productController.newForm);
router.post(
  '/products',
  requireAuth,
  upload.fields([
    { name: 'featuredImageUpload', maxCount: 1 },
    { name: 'galleryImages', maxCount: 20 },
  ]),
  require('../middleware/upload').processImages,
  productController.create,
);
router.get('/products/:id/edit', requireAuth, productController.editForm);
router.post(
  '/products/:id',
  requireAuth,
  upload.fields([
    { name: 'featuredImageUpload', maxCount: 1 },
    { name: 'galleryImages', maxCount: 20 },
  ]),
  require('../middleware/upload').processImages,
  productController.update,
);
router.post('/products/:id/delete', requireAuth, productController.remove);

// Inquiries
router.get('/inquiries', requireAuth, inquiryController.list);
router.get('/inquiries/:id', requireAuth, inquiryController.detail);
router.post('/inquiries/:id/delete', requireAuth, inquiryController.remove);

// Customers CRUD
router.get('/customers', requireAuth, customerController.list);
router.get('/customers/new', requireAuth, customerController.newForm);
router.post('/customers', requireAuth, customerController.create);
router.get('/customers/:id', requireAuth, customerController.detail);
router.get('/customers/:id/edit', requireAuth, customerController.editForm);
router.post('/customers/:id', requireAuth, customerController.update);
router.post('/customers/:id/delete', requireAuth, customerController.remove);

// Sales CRUD
router.get('/sales', requireAuth, saleController.list);
router.get('/sales/new', requireAuth, saleController.newForm);
router.post('/sales', requireAuth, saleController.create);
router.get('/sales/:id', requireAuth, saleController.detail);
router.get('/sales/:id/edit', requireAuth, saleController.editForm);
router.post('/sales/:id', requireAuth, saleController.update);
router.post('/sales/:id/delete', requireAuth, saleController.remove);

module.exports = router;
