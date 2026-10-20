import 'dotenv/config';
import app from './app.js';
import connectDatabase from './config/db.js';

const port = process.env.PORT || 5000;
const host = '0.0.0.0';

if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');

await connectDatabase();

const server = app.listen(port, host, () => {
  console.log(`Farmer marketplace API listening on http://${host}:${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing HTTP server...');
  server.close(() => console.log('HTTP server closed'));
});
