const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const mongoose = require('mongoose');

// Use memory storage so we can process with sharp first
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype);
  if (extOk && mimeOk) return cb(null, true);
  cb(
    new Error('Only image files are allowed (jpeg, jpg, png, gif, webp, svg)'),
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

// Ensure uploads directory exists
async function ensureUploadsDir () {
  const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
}

// Helper function to generate multiple image sizes and save to file system
async function generateImageSizes (
  buffer,
  mediaId,
  baseName,
  ext,
  isGif,
  isSvg,
) {
  const uploadsDir = path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    mediaId.toString(),
  );
  await fs.mkdir(uploadsDir, { recursive: true });

  const sizes = {};

  if (isSvg) {
    // For SVG, save as-is (no resizing)
    const svgPath = path.join(uploadsDir, 'large.svg');
    await fs.writeFile(svgPath, buffer);
    const stats = await fs.stat(svgPath);
    sizes.large = {
      url: `uploads/${mediaId}/large.svg`,
      sizeInKb: Math.round(stats.size / 1024),
    };
    sizes.medium = { ...sizes.large };
    sizes.thumbnail = { ...sizes.large };
  } else if (isGif) {
    // For GIFs, only store original (don't resize to preserve animation)
    const gifPath = path.join(uploadsDir, 'large.gif');
    await fs.writeFile(gifPath, buffer);
    const stats = await fs.stat(gifPath);
    const metadata = await sharp(buffer).metadata();
    sizes.large = {
      url: `uploads/${mediaId}/large.gif`,
      width: metadata.width,
      height: metadata.height,
      sizeInKb: Math.round(stats.size / 1024),
    };
    sizes.medium = { ...sizes.large };
    sizes.thumbnail = { ...sizes.large };
  } else {
    // Generate thumbnail (~300px width max)
    const thumbnailBuffer = await sharp(buffer)
      .rotate()
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    const thumbnailPath = path.join(uploadsDir, 'thumbnail.webp');
    await fs.writeFile(thumbnailPath, thumbnailBuffer);
    const thumbnailStats = await fs.stat(thumbnailPath);
    const thumbnailMeta = await sharp(thumbnailBuffer).metadata();
    sizes.thumbnail = {
      url: `uploads/${mediaId}/thumbnail.webp`,
      width: thumbnailMeta.width,
      height: thumbnailMeta.height,
      sizeInKb: Math.round(thumbnailStats.size / 1024),
    };

    // Generate medium (~900px width max)
    const mediumBuffer = await sharp(buffer)
      .rotate()
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();
    const mediumPath = path.join(uploadsDir, 'medium.webp');
    await fs.writeFile(mediumPath, mediumBuffer);
    const mediumStats = await fs.stat(mediumPath);
    const mediumMeta = await sharp(mediumBuffer).metadata();
    sizes.medium = {
      url: `uploads/${mediaId}/medium.webp`,
      width: mediumMeta.width,
      height: mediumMeta.height,
      sizeInKb: Math.round(mediumStats.size / 1024),
    };

    // Generate large (~1600px width max)
    const largeBuffer = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toBuffer();
    const largePath = path.join(uploadsDir, 'large.webp');
    await fs.writeFile(largePath, largeBuffer);
    const largeStats = await fs.stat(largePath);
    const largeMeta = await sharp(largeBuffer).metadata();
    sizes.large = {
      url: `uploads/${mediaId}/large.webp`,
      width: largeMeta.width,
      height: largeMeta.height,
      sizeInKb: Math.round(largeStats.size / 1024),
    };
  }

  return sizes;
}

// Process image: resize, convert to webp (except GIF/SVG), compress, save to file system
// Special handling for favicon uploads: resize to 32x32px
async function processImage (req, res, next) {
  if (!req.file) return next();
  try {
    await ensureUploadsDir();

    const ext = path.extname(req.file.originalname).toLowerCase();
    const base = path
      .basename(req.file.originalname, ext)
      .replace(/\s+/g, '-')
      .toLowerCase();
    const isGif = ext === '.gif';
    const isSvg = ext === '.svg';
    const isFavicon = req.file.fieldname === 'faviconUpload';

    // Generate unique media ID for directory
    const mediaId = new mongoose.Types.ObjectId();

    // Special handling for favicon: resize to 32x32px
    if (isFavicon) {
      const uploadsDir = path.join(
        __dirname,
        '..',
        'public',
        'uploads',
        mediaId.toString(),
      );
      await fs.mkdir(uploadsDir, { recursive: true });

      let faviconBuffer;
      let faviconExt;

      if (isGif) {
        faviconBuffer = await sharp(req.file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .gif()
          .toBuffer();
        faviconExt = '.gif';
      } else if (isSvg) {
        faviconBuffer = req.file.buffer;
        faviconExt = '.svg';
      } else {
        faviconBuffer = await sharp(req.file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .png()
          .toBuffer();
        faviconExt = '.png';
      }

      const faviconPath = path.join(uploadsDir, `favicon${faviconExt}`);
      await fs.writeFile(faviconPath, faviconBuffer);
      const stats = await fs.stat(faviconPath);

      req.file.mediaId = mediaId;
      req.file.filename = `favicon${faviconExt}`;
      req.file.path = `uploads/${mediaId}/favicon${faviconExt}`;
      req.file.sizes = {
        thumbnail: {
          url: `uploads/${mediaId}/favicon${faviconExt}`,
          sizeInKb: Math.round(stats.size / 1024),
        },
        medium: {
          url: `uploads/${mediaId}/favicon${faviconExt}`,
          sizeInKb: Math.round(stats.size / 1024),
        },
        large: {
          url: `uploads/${mediaId}/favicon${faviconExt}`,
          sizeInKb: Math.round(stats.size / 1024),
        },
      };
      req.file.mimetype = isGif
        ? 'image/gif'
        : isSvg
        ? 'image/svg+xml'
        : 'image/png';

      return next();
    }

    // Generate all sizes for regular images
    const sizes = await generateImageSizes(
      req.file.buffer,
      mediaId,
      base,
      ext,
      isGif,
      isSvg,
    );

    // Store file metadata in req.file
    req.file.mediaId = mediaId;
    req.file.filename = `${base}-large${
      isSvg ? '.svg' : isGif ? '.gif' : '.webp'
    }`;
    req.file.path = sizes.large.url;
    req.file.sizes = sizes;
    req.file.mimetype = isGif
      ? 'image/gif'
      : isSvg
      ? 'image/svg+xml'
      : 'image/webp';

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
    await ensureUploadsDir();

    for (const file of filesToProcess) {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, '-')
        .toLowerCase();
      const isGif = ext === '.gif';
      const isSvg = ext === '.svg';
      const isFavicon = file.fieldname === 'faviconUpload';

      // Generate unique media ID for directory
      const mediaId = new mongoose.Types.ObjectId();

      // Special handling for favicon: resize to 32x32px
      if (isFavicon) {
        const uploadsDir = path.join(
          __dirname,
          '..',
          'public',
          'uploads',
          mediaId.toString(),
        );
        await fs.mkdir(uploadsDir, { recursive: true });

        let faviconBuffer;
        let faviconExt;

        if (isGif) {
          faviconBuffer = await sharp(file.buffer)
            .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
            .gif()
            .toBuffer();
          faviconExt = '.gif';
        } else if (isSvg) {
          faviconBuffer = file.buffer;
          faviconExt = '.svg';
        } else {
          faviconBuffer = await sharp(file.buffer)
            .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
            .png()
            .toBuffer();
          faviconExt = '.png';
        }

        const faviconPath = path.join(uploadsDir, `favicon${faviconExt}`);
        await fs.writeFile(faviconPath, faviconBuffer);
        const stats = await fs.stat(faviconPath);

        file.mediaId = mediaId;
        file.filename = `favicon${faviconExt}`;
        file.path = `uploads/${mediaId}/favicon${faviconExt}`;
        file.sizes = {
          thumbnail: {
            url: `uploads/${mediaId}/favicon${faviconExt}`,
            sizeInKb: Math.round(stats.size / 1024),
          },
          medium: {
            url: `uploads/${mediaId}/favicon${faviconExt}`,
            sizeInKb: Math.round(stats.size / 1024),
          },
          large: {
            url: `uploads/${mediaId}/favicon${faviconExt}`,
            sizeInKb: Math.round(stats.size / 1024),
          },
        };
        file.mimetype = isGif
          ? 'image/gif'
          : isSvg
          ? 'image/svg+xml'
          : 'image/png';
        continue; // Skip to next file
      }

      // Generate all sizes for regular images (including logos)
      const sizes = await generateImageSizes(
        file.buffer,
        mediaId,
        base,
        ext,
        isGif,
        isSvg,
      );

      // Store file metadata in file object
      file.mediaId = mediaId;
      file.filename = `${base}-large${
        isSvg ? '.svg' : isGif ? '.gif' : '.webp'
      }`;
      file.path = sizes.large.url;
      file.sizes = sizes;
      file.mimetype = isGif
        ? 'image/gif'
        : isSvg
        ? 'image/svg+xml'
        : 'image/webp';
    }
    next();
  } catch (err) {
    next(new Error('Error processing images: ' + err.message));
  }
}

module.exports = { upload, processImage, processImages };
