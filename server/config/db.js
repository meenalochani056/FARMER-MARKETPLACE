import mongoose from 'mongoose';

export default async function connectDatabase() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
  return mongoose.connection;
}
