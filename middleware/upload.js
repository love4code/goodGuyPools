const multer = require('multer')
const path = require('path')
const sharp = require('sharp')
const { uploadToGridFS } = require('../utils/gridfs')

// Use memory storage so we can process with sharp first
const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase())
  const mimeOk = allowed.test(file.mimetype)
  if (extOk && mimeOk) return cb(null, true)
  cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'))
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB - GridFS can handle large files
})

// Process image: resize max 1920x1920, convert to webp (except GIF), compress, upload to GridFS
async function processImage(req, res, next) {
  if (!req.file) return next()
  try {
    const ext = path.extname(req.file.originalname).toLowerCase()
    const base = path.basename(req.file.originalname, ext).replace(/\s+/g, '-').toLowerCase()
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const outExt = ext === '.gif' ? '.gif' : '.webp'
    const outName = `${base}-${unique}${outExt}`
    let processedBuffer = req.file.buffer
    let mimeType = req.file.mimetype

    if (ext === '.gif') {
      // Keep GIFs as-is to avoid breaking animations
      mimeType = 'image/gif'
    } else {
      // Process with Sharp: resize, rotate, convert to WebP
      processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .rotate()
        .webp({ quality: 85, effort: 6 })
        .toBuffer()
      mimeType = 'image/webp'
    }

    // Upload to GridFS
    const fileId = await uploadToGridFS(processedBuffer, outName, {
      originalName: req.file.originalname,
      mimetype: mimeType,
      uploadedAt: new Date()
    })

    // Store GridFS file ID and metadata in req.file
    req.file.gridfsId = fileId
    req.file.filename = outName
    req.file.path = `/api/images/${fileId}` // Route to serve from GridFS
    req.file.size = processedBuffer.length
    req.file.mimetype = mimeType

    next()
  } catch (err) {
    next(new Error('Error processing image: ' + err.message))
  }
}

// Process multiple images in req.files (array upload)
async function processImages(req, res, next) {
  if (!req.files || !req.files.length) return next()
  try {
    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase()
      const base = path.basename(file.originalname, ext).replace(/\s+/g, '-').toLowerCase()
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const outExt = ext === '.gif' ? '.gif' : '.webp'
      const outName = `${base}-${unique}${outExt}`
      let processedBuffer = file.buffer
      let mimeType = file.mimetype

      if (ext === '.gif') {
        mimeType = 'image/gif'
      } else {
        processedBuffer = await sharp(file.buffer)
          .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
          .rotate()
          .webp({ quality: 85, effort: 6 })
          .toBuffer()
        mimeType = 'image/webp'
      }

      // Upload to GridFS
      const fileId = await uploadToGridFS(processedBuffer, outName, {
        originalName: file.originalname,
        mimetype: mimeType,
        uploadedAt: new Date()
      })

      file.gridfsId = fileId
      file.filename = outName
      file.path = `/api/images/${fileId}`
      file.size = processedBuffer.length
      file.mimetype = mimeType
    }
    next()
  } catch (err) {
    next(new Error('Error processing images: ' + err.message))
  }
}

module.exports = { upload, processImage, processImages }


