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

// Auth
router.get('/login', adminController.getLogin);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.getLogout);

// Dashboard
router.get('/', requireAuth, adminController.getDashboard);

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
// Edit media metadata
router.get('/media/:id/edit', requireAuth, mediaController.editForm);
router.post('/media/:id', requireAuth, mediaController.update);
router.post('/media/:id/delete', requireAuth, mediaController.remove);
router.get('/media/api/list', requireAuth, mediaController.apiList);

// Settings
router.get('/settings', requireAuth, settingsController.getSettings);
router.post('/settings', requireAuth, settingsController.updateSettings);

// Services CRUD
router.get('/services', requireAuth, serviceController.list);
router.get('/services/new', requireAuth, serviceController.newForm);
router.post('/services', requireAuth, serviceController.create);
router.get('/services/:id/edit', requireAuth, serviceController.editForm);
router.post('/services/:id', requireAuth, serviceController.update);
router.post('/services/:id/delete', requireAuth, serviceController.remove);

// Products CRUD
router.get('/products', requireAuth, productController.list);
router.get('/products/new', requireAuth, productController.newForm);
router.post('/products', requireAuth, productController.create);
router.get('/products/:id/edit', requireAuth, productController.editForm);
router.post('/products/:id', requireAuth, productController.update);
router.post('/products/:id/delete', requireAuth, productController.remove);

module.exports = router;
