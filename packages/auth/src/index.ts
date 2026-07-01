export { Auth, makeAuthLive, resolveAuthProvider } from './resolve';
export { createBetterAuthProvider } from './providers/betterAuth';
export { createCognitoAuthProvider } from './providers/cognito';
export { createLocalAuthProvider } from './providers/local';
export { createSupabaseAuthProvider } from './providers/supabase';
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
  SupabaseAuthConfigSchema,
} from './config';
export type {
  AuthConfig,
  BetterAuthConfig,
  CognitoConfig,
  DataConfig,
  MongoConfig,
  SupabaseAuthConfig,
} from './config';
