import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? true,
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(process.env.SESSION_SECRET));

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'vybekiit-backend',
      message: 'Your API server is running.',
    });
  });

  app.use('/health', healthRouter);
  app.use('/api/auth', authRouter);

  // vybekiit:routes-import
  // vybekiit:routes-mount

  app.use(errorHandler);

  return app;
}
