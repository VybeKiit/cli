import { createNextAuthRoutes } from '@vybekiit/auth/http/next';
import { webAuthHttpDeps } from './authHttpDeps';

/** Next.js auth route handlers wired to the web template dependencies. */
export const authRoutes = createNextAuthRoutes(webAuthHttpDeps);
