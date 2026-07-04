import { createExpressAuthRouter } from '@vybekiit/auth/http/express';
import { createBackendAuthHttpDeps } from '@/lib/authHttpDeps.js';

export const authRouter = createExpressAuthRouter(createBackendAuthHttpDeps);
