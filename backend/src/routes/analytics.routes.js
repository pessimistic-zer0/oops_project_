import express from 'express';
import Complaint from '../models/complaint.js';
import { authenticate, authorize } from '../utils/auth.js';
import { asyncHandler } from '../utils/error.js';

const router = express.Router();

// Admin-only analytics
router.use(authenticate, authorize(['admin']));

router.get(
  '/complaints-overview',
  asyncHandler(async (_req, res) => {
    const data = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } }
    ]);
    res.json({ data });
  })
);

router.get(
  '/by-category',
  asyncHandler(async (_req, res) => {
    const data = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { _id: 0, category: '$_id', count: 1 } }
    ]);
    res.json({ data });
  })
);

router.get(
  '/resolution-time',
  asyncHandler(async (_req, res) => {
    const data = await Complaint.aggregate([
      { $match: { status: 'Resolved' } },
      {
        $project: {
          durationHours: {
            $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgHours: { $avg: '$durationHours' },
          minHours: { $min: '$durationHours' },
          maxHours: { $max: '$durationHours' },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0 } }
    ]);

    res.json(data[0] || { avgHours: 0, minHours: 0, maxHours: 0, count: 0 });
  })
);

export default router;