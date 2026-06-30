import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { createExpressSecurityMiddleware } from '@vybekiit/security/express';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { handlePaymentsWebhook, paymentsRouter } from './routes/payments.routes.js';

export function createApp(): Express {
  const app = express();
  const apiSecurity = createExpressSecurityMiddleware();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(',') ?? true,
      credentials: true,
    }),
  );

  app.post('/api/webhook', apiSecurity, express.raw({ type: '*/*' }), handlePaymentsWebhook);

  app.use('/api', apiSecurity);
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
  app.use('/api', paymentsRouter);

  // vybekiit:routes-import
  // vybekiit:routes-mount

  app.use(errorHandler);

  return app;
}
