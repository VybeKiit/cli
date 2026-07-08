// `@aws-sdk/client-cognito-identity-provider` is the AWS SDK v3 client for Amazon
// Cognito user pools. ADR-0003 routes AWS-DynamoDB apps to Cognito behind the shared
// AuthProvider interface, because DynamoDB has no better-auth adapter — so an AWS-only
// app gets sign-in from a managed AWS service instead of a separate auth database.
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  type ConfirmForgotPasswordCommandOutput,
  ConfirmSignUpCommand,
  type ConfirmSignUpCommandOutput,
  ForgotPasswordCommand,
  type ForgotPasswordCommandOutput,
  GetUserCommand,
  type GetUserCommandOutput,
  InitiateAuthCommand,
  type InitiateAuthCommandOutput,
  ResendConfirmationCodeCommand,
  type ResendConfirmationCodeCommandOutput,
  SignUpCommand,
  type SignUpCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';
import type { CognitoConfig } from '@vybekiit/auth/config';
import { authError, failAuth, toAuthSession } from '@vybekiit/auth/session';
import type { AuthError, AuthProvider } from '@vybekiit/auth/types';
import { type AuthUser, normalizeAuthUser } from '@vybekiit/auth/user';
import { Effect } from 'effect';

type CognitoAuthCommand =
  | ConfirmForgotPasswordCommand
  | ConfirmSignUpCommand
  | ForgotPasswordCommand
  | GetUserCommand
  | InitiateAuthCommand
  | ResendConfirmationCodeCommand
  | SignUpCommand;

type CognitoAuthCommandOutput<Command extends CognitoAuthCommand> =
  Command extends ConfirmForgotPasswordCommand
    ? ConfirmForgotPasswordCommandOutput
    : Command extends ConfirmSignUpCommand
      ? ConfirmSignUpCommandOutput
      : Command extends ForgotPasswordCommand
        ? ForgotPasswordCommandOutput
        : Command extends GetUserCommand
          ? GetUserCommandOutput
          : Command extends InitiateAuthCommand
            ? InitiateAuthCommandOutput
            : Command extends ResendConfirmationCodeCommand
              ? ResendConfirmationCodeCommandOutput
              : SignUpCommandOutput;

/**
 * The narrow slice of the Cognito client this adapter calls: just `.send(command)`.
 * Typed structurally (not against the SDK's huge command union) so a unit test can
 * inject a fake `{ send }` and assert the issued command with NO network. The real
 * {@link CognitoIdentityProviderClient} is structurally assignable to it.
 */
export type CognitoClientLike = {
  readonly send: <Command extends CognitoAuthCommand>(
    command: Command,
  ) => Promise<CognitoAuthCommandOutput<Command>>;
};

/**
 * Settings for {@link createCognitoAuthProvider}: the validated Cognito config plus
 * an optional injected client (default: a real {@link CognitoIdentityProviderClient}).
 * Injecting the client is the test seam that keeps construction offline.
 */
export type CognitoProviderOptions = {
  readonly config: CognitoConfig;
  /** Test seam — a fake client whose `.send` is mocked; omit to build the real one. */
  readonly client?: CognitoClientLike;
};

const COGNITO_CAPABILITIES = {
  emailCode: true,
  passwordReset: true,
  magicLink: false,
  sms: false,
} as const;

/**
 * Build the AWS Cognito {@link AuthProvider} — the auth backend for AWS-data apps
 * (ADR-0003), behind the same interface as better-auth so feature code never branches.
 *
 * Method → Cognito command mapping:
 * - `signUpWithPassword` → `SignUpCommand` (creates an *unconfirmed* user; Cognito
 *   emails a confirmation code, so a returned user is keyed by `UserSub`).
 * - `signInWithPassword` → `InitiateAuthCommand` with the `USER_PASSWORD_AUTH` flow;
 *   the user is then resolved from the returned access token via `GetUserCommand`.
 * - `sendEmailCode` → `ResendConfirmationCodeCommand`. We use the **sign-up
 *   confirmation code** as the email-code path (the simplest real Cognito flow that
 *   delivers a code by email) rather than a custom-auth Lambda challenge, which would
 *   require deploying triggers. `verifyEmailCode` → `ConfirmSignUpCommand` accordingly.
 * - `getUser` → `GetUserCommand` with the access token.
 *
 * Credentials mirror the AWS data/S3/SES adapters: `AWS_REGION` is always required;
 * when both access keys are present we pass them explicitly, otherwise the SDK's
 * default credential chain applies. Every error is narrated as a tagged
 * {@link AuthError} rather than thrown across the boundary.
 *
 * Live-verification note: `ConfirmSignUpCommand` returns no user `sub`, so
 * `verifyEmailCode` keys the confirmed {@link AuthUser} by the email it confirmed —
 * exact id/session behavior on a real pool is deferred to live-secret verification.
 *
 * @param options - Validated Cognito config plus an optional injected client.
 * @returns The Cognito AuthProvider.
 * @example
 * const provider = createCognitoAuthProvider({ config });
 */
export const createCognitoAuthProvider = (options: CognitoProviderOptions): AuthProvider => {
  const { config } = options;
  const client: CognitoClientLike =
    options.client === undefined ? buildCognitoClient(config) : options.client;
  const clientId = config.COGNITO_CLIENT_ID;

  return {
    name: 'cognito',
    capabilities: COGNITO_CAPABILITIES,

    signUpWithPassword: (email, password) =>
      Effect.gen(function* () {
        const { UserSub } = yield* tryCognito('signup_failed', () =>
          client.send(
            new SignUpCommand({
              ClientId: clientId,
              Username: email,
              Password: password,
              UserAttributes: [{ Name: 'email', Value: email }],
            }),
          ),
        );
        const userId = UserSub === undefined ? email : UserSub;
        return yield* toAuthSession({ id: userId, email }, userId, 'Sign up returned no session.');
      }),

    signInWithPassword: (email, password) =>
      Effect.gen(function* () {
        const auth = yield* tryCognito('signin_failed', () =>
          client.send(
            new InitiateAuthCommand({
              ClientId: clientId,
              AuthFlow: 'USER_PASSWORD_AUTH',
              AuthParameters: { USERNAME: email, PASSWORD: password },
            }),
          ),
        );

        const authResult = auth.AuthenticationResult;
        const accessToken = authResult === undefined ? undefined : authResult.AccessToken;
        if (accessToken === undefined || accessToken.length === 0) {
          return yield* failAuth('signin_failed', 'Cognito returned no access token.');
        }
        const user = yield* resolveUserFromAccessToken(client, accessToken, 'signin_failed');
        return yield* toAuthSession(
          { id: user.id, email: user.email === null ? email : user.email },
          accessToken,
          'Sign in returned no session.',
        );
      }),

    sendEmailCode: (email) =>
      Effect.gen(function* () {
        yield* tryCognito('otp_send_failed', () =>
          client.send(new ResendConfirmationCodeCommand({ ClientId: clientId, Username: email })),
        );
        return true as const;
      }),

    verifyEmailCode: (email, code) =>
      Effect.gen(function* () {
        yield* tryCognito('otp_verify_failed', () =>
          client.send(
            new ConfirmSignUpCommand({
              ClientId: clientId,
              Username: email,
              ConfirmationCode: code,
            }),
          ),
        );
        return yield* toAuthSession(
          { id: email, email },
          `cognito-confirmed:${email}`,
          'Code verified but returned no session.',
        );
      }),

    requestPasswordReset: (email) =>
      Effect.gen(function* () {
        yield* tryCognito('reset_request_failed', () =>
          client.send(new ForgotPasswordCommand({ ClientId: clientId, Username: email })),
        );
        return true as const;
      }),

    resetPassword: (token, newPassword) =>
      Effect.gen(function* () {
        const [username, code] = token.includes(':') ? token.split(':', 2) : ['', token];
        if (username === undefined || username.length === 0 || code === undefined) {
          return yield* failAuth(
            'reset_failed',
            'Reset token must be username:code from Cognito flow.',
          );
        }
        yield* tryCognito('reset_failed', () =>
          client.send(
            new ConfirmForgotPasswordCommand({
              ClientId: clientId,
              Username: username,
              ConfirmationCode: code,
              Password: newPassword,
            }),
          ),
        );
        return yield* toAuthSession(
          { id: username, email: username },
          `cognito-reset:${username}`,
          'Password reset succeeded but returned no session.',
        );
      }),

    sendMagicLink: () =>
      failAuth(
        'magic_link_failed',
        'Magic link sign-in is not available on this auth backend — use email code or password.',
      ),

    verifyMagicLink: () =>
      failAuth('magic_link_failed', 'Magic link sign-in is not available on this auth backend.'),

    sendSmsCode: () =>
      failAuth(
        'sms_send_failed',
        'SMS sign-in is not configured — set NOTIFICATIONS_PROVIDER=twilio and Twilio secret settings.',
      ),

    verifySmsCode: () => failAuth('sms_verify_failed', 'SMS sign-in is not configured.'),

    getUser: (sessionToken) => resolveUserFromAccessToken(client, sessionToken, 'get_user_failed'),
  };
};

/** Resolve a Cognito user from an access token via `GetUserCommand`. */
const resolveUserFromAccessToken = (
  client: CognitoClientLike,
  accessToken: string,
  failCode: 'signin_failed' | 'get_user_failed',
): Effect.Effect<AuthUser, AuthError> =>
  Effect.gen(function* () {
    const { Username, UserAttributes } = yield* tryCognito(failCode, () =>
      client.send(new GetUserCommand({ AccessToken: accessToken })),
    );

    const attribute = (name: string): string | undefined => {
      const found =
        UserAttributes === undefined
          ? undefined
          : UserAttributes.find((candidate) => candidate.Name === name);
      return found === undefined ? undefined : found.Value;
    };

    // Cognito's stable user id is the `sub` attribute; fall back to `Username` so a
    // pool that aliases the username to email still yields an id.
    const sub = attribute('sub');
    return yield* toUserEffect(
      { id: sub === undefined ? Username : sub, email: attribute('email') },
      'No user for the given access token.',
    );
  });

type CognitoConfigWithCredentials = CognitoConfig & {
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
};

const hasExplicitAwsCredentials = (config: CognitoConfig): config is CognitoConfigWithCredentials =>
  config.AWS_ACCESS_KEY_ID !== undefined && config.AWS_SECRET_ACCESS_KEY !== undefined;

/** Construct the real Cognito client, with explicit creds or the default chain. */
const buildCognitoClient = (config: CognitoConfig): CognitoIdentityProviderClient =>
  new CognitoIdentityProviderClient({
    region: config.AWS_REGION,
    ...(hasExplicitAwsCredentials(config)
      ? {
          credentials: {
            accessKeyId: config.AWS_ACCESS_KEY_ID,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });

/** Map a raw Cognito user (possibly missing id) to an Effect user. */
const toUserEffect = (
  raw: { id: string | null | undefined; email: string | null | undefined },
  noUserMessage: string,
): Effect.Effect<AuthUser, AuthError> => {
  const user = normalizeAuthUser({ id: raw.id, email: raw.email });
  if (user === null) {
    return failAuth('no_user', noUserMessage);
  }
  return Effect.succeed(user);
};

const tryCognito = <A>(code: string, run: () => Promise<A>): Effect.Effect<A, AuthError> =>
  Effect.tryPromise({
    try: run,
    catch: (caught) => authError(code, errorMessage(caught)),
  });

/** Narrow an unknown caught value to a developer-facing message string. */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'unknown Cognito error';
