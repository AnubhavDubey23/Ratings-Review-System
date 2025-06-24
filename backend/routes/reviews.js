require('dotenv').config();
const express = require('express');
const router = express.Router();
const {
  addReview,
  getReviewsByProduct,
} = require('../controllers/reviewController');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

// Memory storage for file uploads (no local file system needed)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'product-reviews' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

// Modified POST route with Cloudinary upload
router.post(
  '/',
  upload.single('photo'),
  async (req, res, next) => {
    try {
      if (req.file) {
        const result = await uploadToCloudinary(req.file);
        req.uploadedPhoto = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      }
      next();
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      return res.status(500).json({ error: 'Failed to upload image' });
    }
  },
  addReview
);

// GET reviews by product ID (unchanged)
router.get('/:productId', getReviewsByProduct);

module.exports = router;
