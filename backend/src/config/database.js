import mongoose from 'mongoose';

let connectionPromise = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(mongoUri)
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error(`❌ MongoDB Connection Error: ${error.message}`);

      if (process.env.VERCEL !== '1') {
        process.exit(1);
      }

      throw error;
    });

  return connectionPromise;
};

export default connectDB;
