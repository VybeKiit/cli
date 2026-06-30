import { createNextAuthRoutes } from '@vybekiit/auth/http/next';
import { webAuthHttpDeps } from './auth-http-deps';

export const authRoutes = createNextAuthRoutes(webAuthHttpDeps);
