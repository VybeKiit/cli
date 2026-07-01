import { createNextAuthRoutes } from '@vybekiit/auth/http/next';
import { webAuthHttpDeps } from './authHttpDeps';

export const authRoutes = createNextAuthRoutes(webAuthHttpDeps);
