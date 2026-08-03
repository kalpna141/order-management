import mongoose from 'mongoose';

export async function connectDB(uri = process.env.MONGO_URI) {
  if (!uri) {
    throw new Error('MONGO_URI is required. Add it to server/.env.');
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('[db] Connected to MongoDB.');
}
