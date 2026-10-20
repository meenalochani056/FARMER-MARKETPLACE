import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import marketPriceRoutes from './routes/marketPriceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import { AppError, errorHandler, notFound } from './utils/errors.js';

const app = express();

const rawClientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const allowedOrigins = new Set(rawClientUrls);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://localhost:5175');
  allowedOrigins.add('http://127.0.0.1:5175');
}

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.has('*') || allowedOrigins.has(cleanOrigin)) return true;
  const hasVercelConfigured = Array.from(allowedOrigins).some((o) => o.includes('vercel.app'));
  if (hasVercelConfigured && cleanOrigin.endsWith('.vercel.app')) return true;
  return false;
};

app.use(cors({
  origin(origin, callback) {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new AppError('This origin is not allowed by the CORS policy.', 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'uploads')));

// Health checks and root route
app.get('/', (req, res) => res.json({ status: 'ok', service: 'farmer-marketplace-api', message: 'Farmer Marketplace API is running' }));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'farmer-marketplace-api' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'farmer-marketplace-api' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
