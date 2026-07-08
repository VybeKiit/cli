import { createExpressSecurityMiddleware } from '@vybekiit/core/security/express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { handlePaymentsWebhook, paymentsRouter } from './routes/payments.routes.js';

/**
 * Resolve the CORS origin option from the optional env value.
 *
 * @param origin - Comma-separated origin allowlist from the environment.
 * @returns Express CORS origin option.
 * @example
 * const origin = corsOrigin(process.env.CORS_ORIGIN);
 */
const corsOrigin = (origin: string | undefined): string[] | true => {
  if (origin === undefined || origin.length === 0) {
    return true;
  }

  return origin.split(',');
};

/**
 * Create the Express API application.
 *
 * @returns Configured Express app with security, auth, health, and payment routes.
 * @example
 * const app = createApp();
 */
export const createApp = (): Express => {
  const { CORS_ORIGIN, SESSION_SECRET } = process.env;
  const app = express();
  const apiSecurity = createExpressSecurityMiddleware();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigin(CORS_ORIGIN),
      credentials: true,
    }),
  );

  app.post('/api/webhook', apiSecurity, express.raw({ type: '*/*' }), handlePaymentsWebhook);

  app.use('/api', apiSecurity);
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser(SESSION_SECRET));

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
};
