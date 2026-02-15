import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import {
  initializeRedis,
} from './app/redis';
import { initializeSocket } from './app/socket';
import app from './app';
import config from './app/config';

let isDbConnected = false;
let isRedisInitialized = false;

// Connect MongoDB once per serverless instance
const connectDB = async () => {
  if (!isDbConnected) {
    if (!config.database_url) {
      throw new Error('DATABASE_URL is missing in config/env');
    }
    await mongoose.connect(config.database_url);
    console.log('✅ MongoDB connected (Serverless)');
    isDbConnected = true;
  }
};

// Initialize Redis once per serverless instance
const connectRedis = async () => {
  if (!isRedisInitialized) {
    try {
      await initializeRedis();
      console.log('🔌 Redis initialized (Serverless)');
    } catch (err) {
      console.warn('⚠️ Redis failed (Serverless)', err);
    }
    isRedisInitialized = true;
  }
};

// Serverless handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Connect resources once
    await connectDB();
    await connectRedis();

    // Optional: Initialize socket (won't persist in serverless)
    try {
      await initializeSocket(null as any); // Serverless e socket long-living connection possible na
    } catch (err) {
      console.warn('⚠️ Socket initialization skipped in serverless', err);
    }

    // Let Express handle the request
    app(req as any, res as any);
  } catch (err) {
    console.error('❌ Serverless handler error:', err);
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
}
