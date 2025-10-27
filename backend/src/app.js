import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './utils/error.js';

import authRouter from './routes/auth.routes.js';
import complaintRouter from './routes/complaint.routes.js';
import adminRouter from './routes/admin.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import uploadsRouter from './routes/uploads.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve static frontend from top-level /frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = path.resolve(__dirname, '../../frontend');
app.use(express.static(staticDir));

// Health
app.get('/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// API Routers
app.use('/api/auth', authRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/uploads', uploadsRouter);

// Errors
app.use(errorHandler);

export default app;