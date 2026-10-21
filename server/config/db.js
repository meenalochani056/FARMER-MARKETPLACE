import mongoose from 'mongoose';

const DEFAULT_MONGO_URI = 'mongodb+srv://310624104186_db_user:kAUQhFb7GKK7U6cu@farmermarket.rjo9v4h.mongodb.net/test?retryWrites=true&w=majority';

export default async function connectDatabase() {
  const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB connected: ${mongoose.connection.host} (DB: ${mongoose.connection.name})`);
    return mongoose.connection;
  } catch (error) {
    if (error.name === 'MongooseServerSelectionError') {
      console.error('MongoDB Atlas Connection Error: Unable to reach Atlas cluster.');
      console.error('Action required: Ensure 0.0.0.0/0 (Allow access from anywhere) is enabled in MongoDB Atlas -> Network Access.');
    }
    throw error;
  }
}
