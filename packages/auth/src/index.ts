export { resolveAuthProvider } from './resolve';
export { createBetterAuthProvider } from './providers/better-auth/index';
export { createCognitoAuthProvider } from './providers/cognito/index';
export { createLocalAuthProvider } from './providers/local/index';
export { normalizeAuthUser, type AuthUser } from './user';
export type { AuthProvider, AuthProviderName } from './types';
