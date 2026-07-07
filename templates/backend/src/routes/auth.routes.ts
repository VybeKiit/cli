import { createExpressAuthRouter } from '@vybekiit/auth/http/express';
import { createBackendAuthHttpDeps } from '@/lib/authHttpDeps.js';

/** Express router that exposes the backend auth HTTP endpoints. */
export const authRouter = createExpressAuthRouter(createBackendAuthHttpDeps);
