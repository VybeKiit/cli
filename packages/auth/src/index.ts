export { Auth, makeAuthLive, resolveAuthProvider } from './resolve';
export { createBetterAuthProvider } from './providers/better-auth/index';
export { createCognitoAuthProvider } from './providers/cognito/index';
export { createLocalAuthProvider } from './providers/local/index';
export { normalizeAuthUser, type AuthUser } from './user';
export { AuthError } from './types';
export type { AuthCapabilities, AuthProvider, AuthProviderName } from './types';
export type { AuthSession } from './session';
export { LOCAL_DEV_SESSION_TOKEN, toSessionResult, userFromSession } from './session';
export type { SmsGateway } from './gateways';
export {
  AuthConfigSchema,
  BetterAuthConfigSchema,
  CognitoConfigSchema,
  DataConfigSchema,
  MongoConfigSchema,
} from './config';
export type {
  AuthConfig,
  BetterAuthConfig,
  CognitoConfig,
  DataConfig,
  MongoConfig,
} from './config';
