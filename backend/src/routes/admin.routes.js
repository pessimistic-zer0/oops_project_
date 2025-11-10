import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authenticate, authorize } from '../utils/auth.js';
import { asyncHandler } from '../utils/error.js';

const router = express.Router();

// All admin routes require admin auth
router.use(authenticate, authorize(['admin']));

// Create a user (worker/admin)
router.post(
  '/users',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, roomNumber } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, and role are required' });
    }
    if (!['worker', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be worker or admin' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      roomNumber,
      passwordHash,
      role
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  })
);

// List users (optional role filter + pagination)
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { role, page = '1', limit = '20' } = req.query;
    const query = {};
    if (role) query.role = role;

    const p = Math.max(parseInt(page, 10), 1);
    const l = Math.min(Math.max(parseInt(limit, 10), 1), 100);

    const [items, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).select('_id name email role').lean(),
      User.countDocuments(query)
    ]);

    res.json({ items, total, page: p, limit: l });
  })
);

export default router;