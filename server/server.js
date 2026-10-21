import 'dotenv/config';
import app from './app.js';
import connectDatabase from './config/db.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'FarmLink_Production_JWT_Secret_2026_SecureKey';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'https://farmer-marketplace-nine.vercel.app';

const port = process.env.PORT || 5000;
const host = '0.0.0.0';

await connectDatabase();

const server = app.listen(port, host, () => {
  console.log(`Farmer marketplace API listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing HTTP server...');
  server.close(() => console.log('HTTP server closed'));
});
