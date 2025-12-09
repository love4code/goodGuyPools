const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let gridFSBucket = null;

// Initialize GridFS bucket
function getGridFSBucket () {
  if (!gridFSBucket) {
    const db = mongoose.connection.db;
    gridFSBucket = new GridFSBucket(db, { bucketName: 'images' });
  }
  return gridFSBucket;
}

// Upload file to GridFS
async function uploadToGridFS (buffer, filename, metadata = {}) {
  return new Promise((resolve, reject) => {
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: metadata,
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });

    uploadStream.end(buffer);
  });
}

// Delete file from GridFS
async function deleteFromGridFS (fileId) {
  try {
    const bucket = getGridFSBucket();
    await bucket.delete(fileId);
    return true;
  } catch (error) {
    console.error('Error deleting from GridFS:', error);
    return false;
  }
}

// Get file info from GridFS
async function getFileInfo (fileId) {
  try {
    const bucket = getGridFSBucket();
    const files = await bucket.find({ _id: fileId }).toArray();
    return files[0] || null;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
}

// Download file from GridFS as buffer
async function downloadFromGridFS (fileId) {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const downloadStream = bucket.openDownloadStream(fileId);
      const chunks = [];

      downloadStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on('error', (error) => {
        reject(error);
      });

      downloadStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getGridFSBucket,
  uploadToGridFS,
  deleteFromGridFS,
  getFileInfo,
  downloadFromGridFS,
};
