import express from 'express';
import mongoose from 'mongoose';
import Complaint from '../models/complaint.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/error.js';
import { authenticate, authorize } from '../utils/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// All complaint routes require auth
router.use(authenticate);

// Create complaint (supports JSON or multipart with images)
router.post(
  '/',
  authorize(['student']),
  (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
      return upload.array('images', 5)(req, res, next);
    }
    next();
  },
  asyncHandler(async (req, res) => {
    const { category, description } = req.body;
    if (!category || !description) {
      return res.status(400).json({ error: 'category and description are required' });
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const bodyImages = Array.isArray(req.body.images) ? req.body.images : [];
    const images = [...bodyImages, ...files.map((f) => `/uploads/${f.filename}`)];

    const complaint = await Complaint.create({
      userId: req.user._id,
      category,
      description,
      images
    });
    res.status(201).json(complaint);
  })
);

// List complaints (role-scoped with optional filters)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const role = req.user.role;
    const query = {};
    if (role === 'student') {
      query.userId = req.user._id;
    } else if (role === 'worker') {
      query.assignedWorkerId = req.user._id;
    } // admin sees all

    const { status, category, from, to } = req.query;
    if (status) query.status = status;
    if (category) query.category = category;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Complaint.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Complaint.countDocuments(query)
    ]);

    res.json({ items, total, page, limit });
  })
);

// Get complaint by id (scope-aware)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid complaint id' });
    }

    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    const role = req.user.role;
    const isOwner = c.userId.toString() === req.user._id.toString();
    const isAssigned = c.assignedWorkerId && c.assignedWorkerId.toString() === req.user._id.toString();

    if (role === 'student' && !isOwner) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'worker' && !isAssigned) return res.status(403).json({ error: 'Forbidden' });

    res.json(c);
  })
);

// Assign worker (admin)
router.put(
  '/:id/assign',
  authorize(['admin']),
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid complaint id' });
    }

    const { workerId } = req.body;
    if (!workerId) return res.status(400).json({ error: 'workerId is required' });
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return res.status(400).json({ error: 'Invalid workerId' });
    }

    const worker = await User.findById(workerId).select('_id role');
    if (!worker || worker.role !== 'worker') {
      return res.status(400).json({ error: 'workerId must belong to an existing worker' });
    }

    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    c.assignedWorkerId = workerId;
    if (c.status === 'Pending') c.status = 'Assigned';
    await c.save();

    res.json(c);
  })
);

// Update status (admin/worker)
router.put(
  '/:id/status',
  authorize(['admin', 'worker']),
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid complaint id' });
    }

    const { status } = req.body;
    const allowed = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    if (req.user.role === 'worker') {
      const isAssigned = c.assignedWorkerId && c.assignedWorkerId.toString() === req.user._id.toString();
      if (!isAssigned) return res.status(403).json({ error: 'Forbidden' });

      const validTransitions = {
        Assigned: ['In Progress'],
        'In Progress': ['Resolved']
      };
      const options = validTransitions[c.status] || [];
      if (!options.includes(status)) return res.status(400).json({ error: 'Invalid status transition' });
    }

    c.status = status;
    await c.save();
    res.json(c);
  })
);

// Add comment (admin/worker)
router.post(
  '/:id/comments',
  authorize(['admin', 'worker']),
  asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid complaint id' });
    }

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const c = await Complaint.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Complaint not found' });

    if (req.user.role === 'worker') {
      const isAssigned = c.assignedWorkerId && c.assignedWorkerId.toString() === req.user._id.toString();
      if (!isAssigned) return res.status(403).json({ error: 'Forbidden' });
    }

    c.comments.push({
      author: req.user._id,
      message,
      timestamp: new Date()
    });
    await c.save();

    res.status(201).json(c);
  })
);

export default router;