const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/evidence');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurable max file size (default 25MB)
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `evid_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'video/mp4',
    'video/webm'
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.mp4', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type "${file.originalname}". Only JPG, PNG, WEBP, PDF, MP4, and WEBM files are allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5 // Allow up to 5 evidence files per submission
  },
  fileFilter: fileFilter
});

// Helper function to calculate SHA-256 hash of a stored file
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
}

module.exports = {
  upload,
  uploadDir,
  calculateFileHash,
  MAX_FILE_SIZE_MB
};
