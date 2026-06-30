import { createExpressAuthRouter } from '@vybekiit/auth/http/express';
import { createBackendAuthHttpDeps } from '../lib/auth-http-deps.js';

export const authRouter = createExpressAuthRouter(createBackendAuthHttpDeps);
