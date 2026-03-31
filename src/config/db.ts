import mongoose from 'mongoose';
import config from './env';

export const initializeDB = async (): Promise<void> => {
  try {
    if (!config.database_url) {
      throw new Error('DATABASE_URL is missing in config/env');
    }

    await mongoose.connect(config.database_url);
    console.log(`✅ MongoDB connected - PID: ${process.pid}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed - PID: ${process.pid}`, error);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ Error during MongoDB disconnection:', error);
  }
};


