import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import connectDatabase from './config/db.js';
import app from './app.js';
import { seedDatabase } from './seed/seed.js';

const database = await MongoMemoryServer.create();
process.env.MONGO_URI = database.getUri('farmer_marketplace');
process.env.JWT_SECRET ||= randomBytes(48).toString('hex');
let httpServer;

async function shutdown(signal) {
  console.log(`${signal} received; shutting down FarmLink demo.`);
  if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await database.stop();
  process.exit(0);
}

try {
  await connectDatabase();
  const result = await seedDatabase();
  const port = Number(process.env.PORT || 5000);
  httpServer = app.listen(port, () => {
    console.log(`FarmLink demo API listening on http://localhost:${port}/api`);
    console.log(`Seeded ${result.farmers} farmers, ${result.buyers} buyers, and ${result.products} products.`);
    console.log('Demo accounts: farmer@example.com / Farmer@123 · buyer@example.com / Buyer@123 · admin@example.com / Admin@123');
    console.log('This demo database runs in memory and is reset when the server stops.');
  });
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('Unable to start the FarmLink demo:', error);
  await mongoose.disconnect();
  await database.stop();
  process.exitCode = 1;
}
