import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { asyncHandler } from '../utils/error.js';
import { signToken } from '../utils/jwt.js';
import { loginLimiter } from '../utils/rateLimit.js';

const router = express.Router();

// Register student
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, roomNumber, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      roomNumber,
      email,
      phone,
      passwordHash,
      role: 'student'
    });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, roomNumber: user.roomNumber }
    });
  })
);

// Login (student/admin/worker)
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, roomNumber: user.roomNumber }
    });
  })
);

export default router;