const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const mongoose = require('mongoose');
const { uploadToGridFS } = require('../utils/gridfs');

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

// Helper function to generate multiple image sizes and upload to GridFS
async function generateImageSizes (
  buffer,
  mediaId,
  baseName,
  ext,
  isGif,
  isSvg,
) {
  const sizes = {};

  if (isSvg) {
    // For SVG, save as-is (no resizing)
    const fileId = await uploadToGridFS(buffer, `${mediaId}-large.svg`, {
      mediaId: mediaId.toString(),
      size: 'large',
      type: 'svg',
    });
    const sizeInKb = Math.round(buffer.length / 1024);
    sizes.large = {
      fileId,
      sizeInKb,
    };
    sizes.medium = { ...sizes.large };
    sizes.thumbnail = { ...sizes.large };
  } else if (isGif) {
    // For GIFs, only store original (don't resize to preserve animation)
    const fileId = await uploadToGridFS(buffer, `${mediaId}-large.gif`, {
      mediaId: mediaId.toString(),
      size: 'large',
      type: 'gif',
    });
    const metadata = await sharp(buffer).metadata();
    const sizeInKb = Math.round(buffer.length / 1024);
    sizes.large = {
      fileId,
      width: metadata.width,
      height: metadata.height,
      sizeInKb,
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
    const thumbnailFileId = await uploadToGridFS(
      thumbnailBuffer,
      `${mediaId}-thumbnail.webp`,
      { mediaId: mediaId.toString(), size: 'thumbnail', type: 'webp' },
    );
    const thumbnailMeta = await sharp(thumbnailBuffer).metadata();
    sizes.thumbnail = {
      fileId: thumbnailFileId,
      width: thumbnailMeta.width,
      height: thumbnailMeta.height,
      sizeInKb: Math.round(thumbnailBuffer.length / 1024),
    };

    // Generate medium (~900px width max)
    const mediumBuffer = await sharp(buffer)
      .rotate()
      .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 })
      .toBuffer();
    const mediumFileId = await uploadToGridFS(
      mediumBuffer,
      `${mediaId}-medium.webp`,
      { mediaId: mediaId.toString(), size: 'medium', type: 'webp' },
    );
    const mediumMeta = await sharp(mediumBuffer).metadata();
    sizes.medium = {
      fileId: mediumFileId,
      width: mediumMeta.width,
      height: mediumMeta.height,
      sizeInKb: Math.round(mediumBuffer.length / 1024),
    };

    // Generate large (~1600px width max)
    const largeBuffer = await sharp(buffer)
      .rotate()
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toBuffer();
    const largeFileId = await uploadToGridFS(
      largeBuffer,
      `${mediaId}-large.webp`,
      { mediaId: mediaId.toString(), size: 'large', type: 'webp' },
    );
    const largeMeta = await sharp(largeBuffer).metadata();
    sizes.large = {
      fileId: largeFileId,
      width: largeMeta.width,
      height: largeMeta.height,
      sizeInKb: Math.round(largeBuffer.length / 1024),
    };
  }

  return sizes;
}

// Process image: resize, convert to webp (except GIF/SVG), compress, upload to GridFS
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
    const isSvg = ext === '.svg';
    const isFavicon = req.file.fieldname === 'faviconUpload';

    // Generate unique media ID
    const mediaId = new mongoose.Types.ObjectId();

    // Special handling for favicon: resize to 32x32px
    if (isFavicon) {
      let faviconBuffer;
      let faviconExt;
      let mimeType;

      if (isGif) {
        faviconBuffer = await sharp(req.file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .gif()
          .toBuffer();
        faviconExt = '.gif';
        mimeType = 'image/gif';
      } else if (isSvg) {
        faviconBuffer = req.file.buffer;
        faviconExt = '.svg';
        mimeType = 'image/svg+xml';
      } else {
        faviconBuffer = await sharp(req.file.buffer)
          .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
          .png()
          .toBuffer();
        faviconExt = '.png';
        mimeType = 'image/png';
      }

      const faviconFileId = await uploadToGridFS(
        faviconBuffer,
        `${mediaId}-favicon${faviconExt}`,
        { mediaId: mediaId.toString(), type: 'favicon' },
      );

      req.file.mediaId = mediaId;
      req.file.filename = `favicon${faviconExt}`;
      req.file.sizes = {
        thumbnail: {
          fileId: faviconFileId,
          sizeInKb: Math.round(faviconBuffer.length / 1024),
        },
        medium: {
          fileId: faviconFileId,
          sizeInKb: Math.round(faviconBuffer.length / 1024),
        },
        large: {
          fileId: faviconFileId,
          sizeInKb: Math.round(faviconBuffer.length / 1024),
        },
      };
      req.file.mimetype = mimeType;

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
    for (const file of filesToProcess) {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, '-')
        .toLowerCase();
      const isGif = ext === '.gif';
      const isSvg = ext === '.svg';
      const isFavicon = file.fieldname === 'faviconUpload';

      // Generate unique media ID
      const mediaId = new mongoose.Types.ObjectId();

      // Special handling for favicon: resize to 32x32px
      if (isFavicon) {
        let faviconBuffer;
        let faviconExt;
        let mimeType;

        if (isGif) {
          faviconBuffer = await sharp(file.buffer)
            .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
            .gif()
            .toBuffer();
          faviconExt = '.gif';
          mimeType = 'image/gif';
        } else if (isSvg) {
          faviconBuffer = file.buffer;
          faviconExt = '.svg';
          mimeType = 'image/svg+xml';
        } else {
          faviconBuffer = await sharp(file.buffer)
            .resize(32, 32, { fit: 'cover', withoutEnlargement: false })
            .png()
            .toBuffer();
          faviconExt = '.png';
          mimeType = 'image/png';
        }

        const faviconFileId = await uploadToGridFS(
          faviconBuffer,
          `${mediaId}-favicon${faviconExt}`,
          { mediaId: mediaId.toString(), type: 'favicon' },
        );

        file.mediaId = mediaId;
        file.filename = `favicon${faviconExt}`;
        file.sizes = {
          thumbnail: {
            fileId: faviconFileId,
            sizeInKb: Math.round(faviconBuffer.length / 1024),
          },
          medium: {
            fileId: faviconFileId,
            sizeInKb: Math.round(faviconBuffer.length / 1024),
          },
          large: {
            fileId: faviconFileId,
            sizeInKb: Math.round(faviconBuffer.length / 1024),
          },
        };
        file.mimetype = mimeType;
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
