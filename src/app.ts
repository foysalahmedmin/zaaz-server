import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import session from 'express-session';
import path from 'path';
import config from './app/config';
import error from './app/middlewares/error.middleware';
import log from './app/middlewares/log.middleware';
import notfound from './app/middlewares/not-found.middleware';
import router from './app/routes';

dotenv.config();
const app: Application = express();

app.set('trust proxy', true);

// Global JSON body parser - but skip webhook routes (they need raw body for signature verification)
app.use((req, res, next) => {
  // Skip body parsing for webhook routes - they need raw body for Stripe signature verification
  if (req.path.includes('/webhook/')) {
    return next();
  }
  express.json({ limit: '1mb' })(req, res, next);
});

app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3008',
      'http://localhost:8080',
      'http://localhost:5000',
      'http://localhost:5005',
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);

app.use(
  session({
    secret: config.session_secret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.database_url,
      ttl: 60 * 60 * 24 * 30,
    }),
    cookie: {
      secure: config.node_dev === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

// Log request middleware
app.use(log);

// Root route
app.get('/', (_req, res) => {
  res.send('Welcome to the application!');
});

// Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', router);

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Error handling middleware
app.use(error);
app.use(notfound);

export default app;
