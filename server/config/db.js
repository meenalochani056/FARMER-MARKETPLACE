import mongoose from 'mongoose';

export default async function connectDatabase() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return mongoose.connection;
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.error('MongoDB Atlas Connection Error: Unable to reach Atlas cluster.');
      console.error('Action required: Ensure 0.0.0.0/0 (Allow access from anywhere) is enabled in MongoDB Atlas -> Network Access.');
    }
    throw error;
  }
}
