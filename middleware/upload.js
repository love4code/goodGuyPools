const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { uploadToGridFS } = require('../utils/gridfs');

// Use memory storage so we can process with sharp first
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB - GridFS can handle large files
});

// Helper function to generate multiple image sizes
async function generateImageSizes (buffer, baseName, ext, isGif) {
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const outExt = isGif ? '.gif' : '.webp';
  const sizes = {};

  if (isGif) {
    // For GIFs, only store original (don't resize to preserve animation)
    const fileId = await uploadToGridFS(
      buffer,
      `${baseName}-${unique}${outExt}`,
      {
        originalName: `${baseName}${ext}`,
        mimetype: 'image/gif',
        uploadedAt: new Date(),
        size: 'original',
      },
    );
    sizes.thumbnail = { gridfsId: fileId, filePath: `/api/images/${fileId}` };
    sizes.medium = { gridfsId: fileId, filePath: `/api/images/${fileId}` };
    sizes.large = { gridfsId: fileId, filePath: `/api/images/${fileId}` };
  } else {
    // Generate thumbnail (300x300)
    const thumbnailBuffer = await sharp(buffer)
      .rotate()
      .resize(300, 300, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    const thumbnailId = await uploadToGridFS(
      thumbnailBuffer,
      `${baseName}-${unique}-thumb${outExt}`,
      {
        originalName: `${baseName}${ext}`,
        mimetype: 'image/webp',
        uploadedAt: new Date(),
        size: 'thumbnail',
      },
    );
    sizes.thumbnail = {
      gridfsId: thumbnailId,
      filePath: `/api/images/${thumbnailId}`,
    };

    // Generate medium (800x800)
    const mediumBuffer = await sharp(buffer)
      .rotate()
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();
    const mediumId = await uploadToGridFS(
      mediumBuffer,
      `${baseName}-${unique}-medium${outExt}`,
      {
        originalName: `${baseName}${ext}`,
        mimetype: 'image/webp',
        uploadedAt: new Date(),
        size: 'medium',
      },
    );
    sizes.medium = { gridfsId: mediumId, filePath: `/api/images/${mediumId}` };

    // Generate large (1920x1920)
    const largeBuffer = await sharp(buffer)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toBuffer();
    const largeId = await uploadToGridFS(
      largeBuffer,
      `${baseName}-${unique}-large${outExt}`,
      {
        originalName: `${baseName}${ext}`,
        mimetype: 'image/webp',
        uploadedAt: new Date(),
        size: 'large',
      },
    );
    sizes.large = { gridfsId: largeId, filePath: `/api/images/${largeId}` };
  }

  return sizes;
}

// Process image: resize max 1920x1920, convert to webp (except GIF), compress, upload to GridFS
// Special handling for favicon uploads: resize to 32x32px
async function processImage (req, res, next) {
  if (!req.file) return next();
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const base = path
      .basename(req.file.originalname, ext)
      .replace(/\s+/g, '-')
      .toLowerCase();
    const isGif = ext === '.gif';
    const isFavicon = req.file.fieldname === 'faviconUpload';

    // Special handling for favicon: resize to 32x32px
    if (isFavicon) {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      let faviconBuffer;
      let faviconMimetype;
      let faviconExt;

      if (isGif) {
        // For GIF favicons, resize to 32x32 while preserving format
        faviconBuffer = await sharp(req.file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .gif()
          .toBuffer();
        faviconMimetype = 'image/gif';
        faviconExt = '.gif';
      } else {
        // For other formats, convert to PNG for better favicon support
        faviconBuffer = await sharp(req.file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .png()
          .toBuffer();
        faviconMimetype = 'image/png';
        faviconExt = '.png';
      }

      const faviconId = await uploadToGridFS(
        faviconBuffer,
        `favicon-${unique}${faviconExt}`,
        {
          originalName: req.file.originalname,
          mimetype: faviconMimetype,
          uploadedAt: new Date(),
          size: 'favicon',
        },
      );

      // Store GridFS file ID and metadata in req.file
      req.file.gridfsId = faviconId;
      req.file.filename = `favicon-${unique}${faviconExt}`;
      req.file.path = `/api/images/${faviconId}`;
      req.file.sizes = {
        thumbnail: {
          gridfsId: faviconId,
          filePath: `/api/images/${faviconId}`,
        },
        medium: { gridfsId: faviconId, filePath: `/api/images/${faviconId}` },
        large: { gridfsId: faviconId, filePath: `/api/images/${faviconId}` },
      };
      req.file.mimetype = faviconMimetype;

      return next();
    }

    // Generate all sizes for regular images
    const sizes = await generateImageSizes(req.file.buffer, base, ext, isGif);

    // Store GridFS file IDs and metadata in req.file
    req.file.gridfsId = sizes.large.gridfsId; // Use large as primary
    req.file.filename = `${base}-large.webp`;
    req.file.path = sizes.large.filePath; // Route to serve from GridFS
    req.file.sizes = sizes; // Store all size references
    req.file.mimetype = isGif ? 'image/gif' : 'image/webp';

    next();
  } catch (err) {
    next(new Error('Error processing image: ' + err.message));
  }
}

// Process multiple images in req.files (array upload or fields upload)
async function processImages (req, res, next) {
  if (!req.files) return next();

  // Handle both array format (upload.array) and object format (upload.fields)
  let filesToProcess = [];
  if (Array.isArray(req.files)) {
    filesToProcess = req.files;
  } else {
    // Convert fields object to flat array
    for (const fieldName in req.files) {
      if (Array.isArray(req.files[fieldName])) {
        filesToProcess.push(...req.files[fieldName]);
      }
    }
  }

  if (filesToProcess.length === 0) return next();

  try {
    for (const file of filesToProcess) {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, '-')
        .toLowerCase();
      const isGif = ext === '.gif';
      const isFavicon = file.fieldname === 'faviconUpload';

      // Special handling for favicon: resize to 32x32px
      if (isFavicon) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        let faviconBuffer;
        let faviconMimetype;
        let faviconExt;

        if (isGif) {
          // For GIF favicons, resize to 32x32 while preserving format
          faviconBuffer = await sharp(file.buffer)
            .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
            .gif()
            .toBuffer();
          faviconMimetype = 'image/gif';
          faviconExt = '.gif';
        } else {
          // For other formats, convert to PNG for better favicon support
          faviconBuffer = await sharp(file.buffer)
            .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
            .png()
            .toBuffer();
          faviconMimetype = 'image/png';
          faviconExt = '.png';
        }

        const faviconId = await uploadToGridFS(
          faviconBuffer,
          `favicon-${unique}${faviconExt}`,
          {
            originalName: file.originalname,
            mimetype: faviconMimetype,
            uploadedAt: new Date(),
            size: 'favicon',
          },
        );

        // Store GridFS file ID and metadata in file object
        file.gridfsId = faviconId;
        file.filename = `favicon-${unique}${faviconExt}`;
        file.path = `/api/images/${faviconId}`;
        file.sizes = {
          thumbnail: {
            gridfsId: faviconId,
            filePath: `/api/images/${faviconId}`,
          },
          medium: { gridfsId: faviconId, filePath: `/api/images/${faviconId}` },
          large: { gridfsId: faviconId, filePath: `/api/images/${faviconId}` },
        };
        file.mimetype = faviconMimetype;
        continue; // Skip to next file
      }

      // Generate all sizes for regular images (including logos)
      const sizes = await generateImageSizes(file.buffer, base, ext, isGif);

      // Store GridFS file IDs and metadata in file object
      file.gridfsId = sizes.large.gridfsId; // Use large as primary
      file.filename = `${base}-large.webp`;
      file.path = sizes.large.filePath;
      file.sizes = sizes; // Store all size references
      file.mimetype = isGif ? 'image/gif' : 'image/webp';
    }
    next();
  } catch (err) {
    next(new Error('Error processing images: ' + err.message));
  }
}

module.exports = { upload, processImage, processImages };
