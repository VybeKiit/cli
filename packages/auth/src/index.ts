export { resolveAuthProvider } from './resolve';
export { createBetterAuthProvider } from './providers/better-auth';
export { createCognitoAuthProvider } from './providers/cognito';
export { createLocalAuthProvider } from './providers/local';
export { normalizeAuthUser, type AuthUser } from './user';
export type { AuthProvider, AuthProviderName } from './types';
