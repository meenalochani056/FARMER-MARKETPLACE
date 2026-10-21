import 'dotenv/config';
import app from '../app.js';
import connectDatabase from '../config/db.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'FarmLink_Production_JWT_Secret_2026_SecureKey';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'https://farmer-marketplace-nine.vercel.app';

export default async function handler(req, res) {
  await connectDatabase();
  return app(req, res);
}
