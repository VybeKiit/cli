export { resolveAuthProvider } from './resolve';
export { createBetterAuthProvider } from './providers/better-auth/index';
export { createCognitoAuthProvider } from './providers/cognito/index';
export { createLocalAuthProvider } from './providers/local/index';
export { normalizeAuthUser, type AuthUser } from './user';
export type { AuthCapabilities, AuthProvider, AuthProviderName } from './types';
export type { AuthSession } from './session';
export { LOCAL_DEV_SESSION_TOKEN, toSessionResult, userFromSession } from './session';
export type { SmsGateway } from './gateways';
