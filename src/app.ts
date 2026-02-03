import MongoStore from 'connect-mongo';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Application } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';
import config from './app/config';
import error from './app/middlewares/error.middleware';
import log from './app/middlewares/log.middleware';
import notfound from './app/middlewares/not-found.middleware';
import { globalRateLimiter } from './app/middlewares/rate-limit.middleware';
import sanitizeMiddleware from './app/middlewares/sanitize.middleware';
import router from './app/routes';

dotenv.config();
const app: Application = express();

// Use helmet for security headers
app.use(helmet());

// Apply global rate limiting
app.use(globalRateLimiter);

app.set('trust proxy', 1);

// Global JSON body parser - but skip webhook routes
app.use((req, res, next) => {
  if (req.path.includes('/webhook/')) {
    return next();
  }
  express.json({ limit: '1mb' })(req, res, next);
});

// Sanitize data after body parsing
app.use(sanitizeMiddleware);

app.use(cookieParser());

app.use(
  cors({
    origin: [
      'https://zaaz.vercel.app',
      'https://www.zaaz.vercel.app',
      'https://zaaz-website.vercel.app',
      'https://www.zaaz-website.vercel.app',
      'https://zaaz-server.vercel.app',
      'https://www.zaaz-server.vercel.app',
      'http://localhost:3000',
      'http://localhost:3008',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5000',
      'http://localhost:5005',
      process.env.URL as string,
      process.env.ADMINPANEL_URL as string,
      process.env.WEBSITE_URL as string,
    ]?.filter(Boolean),
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

// API routes
app.use('/api', router);

// Health check route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Static file serving for frontend (SPA)
app.use(express.static(path.join(__dirname, '../public/dist')));

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/dist/index.html'));
});

// Error handling middleware
app.use(error);
app.use(notfound);

export default app;
