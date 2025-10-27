import express from 'express';
import { upload } from '../utils/upload.js';
import { authenticate } from '../utils/auth.js';
import { asyncHandler } from '../utils/error.js';

const router = express.Router();

// Upload up to 5 images, returns array of URLs
router.post(
  '/images',
  authenticate,
  upload.array('images', 5),
  asyncHandler(async (req, res) => {
    const urls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    res.status(201).json({ urls });
  })
);

export default router;