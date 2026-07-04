export { createExpressAuthRouter } from './express';
export type {
  AuthHttpDeps,
  AuthHttpMethod,
  AuthHttpResponse,
  AuthHttpSession,
  AuthHttpTelemetry,
} from './handlers';
export {
  handleForgotPassword,
  handleMe,
  handleResetPassword,
  handleSendEmailCode,
  handleSendMagicLink,
  handleSendSmsCode,
  handleSignIn,
  handleSignOut,
  handleSignUp,
  handleVerifyEmailCode,
  handleVerifyMagicLink,
  handleVerifySmsCode,
} from './handlers';
export { createNextAuthRoutes, type NextAuthRoutes } from './next';
export {
  EmailCodeBodySchema,
  EmailOnlyBodySchema,
  PhoneCodeBodySchema,
  PhoneOnlyBodySchema,
  ResetPasswordBodySchema,
  SignInBodySchema,
  SignUpBodySchema,
  TokenOnlyBodySchema,
} from './schemas';
