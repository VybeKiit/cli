// `@aws-sdk/client-cognito-identity-provider` is the AWS SDK v3 client for Amazon
// Cognito user pools. ADR-0003 routes AWS-DynamoDB apps to Cognito behind the shared
// AuthProvider interface, because DynamoDB has no better-auth adapter — so an AWS-only
// app gets sign-in from a managed AWS service instead of a separate auth database.
import {
  type AttributeType,
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  GetUserCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { type Result, fail, ok } from '@vybekiit/core';
import type { CognitoConfig } from '../../config';
import { type AuthProviderResult, toEffectAuthProvider } from '../../effect-bridge';
import { toSessionResult } from '../../session';
import type { AuthProvider } from '../../types';
import { type AuthUser, normalizeAuthUser } from '../../user';

/**
 * The narrow slice of the Cognito client this adapter calls: just `.send(command)`.
 * Typed structurally (not against the SDK's huge command union) so a unit test can
 * inject a fake `{ send }` and assert the issued command with NO network. The real
 * {@link CognitoIdentityProviderClient} is structurally assignable to it.
 */
export interface CognitoClientLike {
  send(command: unknown): Promise<unknown>;
}

/**
 * Settings for {@link createCognitoAuthProvider}: the validated Cognito config plus
 * an optional injected client (default: a real {@link CognitoIdentityProviderClient}).
 * Injecting the client is the test seam that keeps construction offline.
 */
export interface CognitoProviderOptions {
  readonly config: CognitoConfig;
  /** Test seam — a fake client whose `.send` is mocked; omit to build the real one. */
  readonly client?: CognitoClientLike;
}

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
 * default credential chain applies. Every error is narrated as a {@link Result}
 * `fail(...)` rather than thrown across the boundary.
 *
 * Live-verification note: `ConfirmSignUpCommand` returns no user `sub`, so
 * `verifyEmailCode` keys the confirmed {@link AuthUser} by the email it confirmed —
 * exact id/session behavior on a real pool is deferred to live-secret verification.
 */
const COGNITO_CAPABILITIES = {
  emailCode: true,
  passwordReset: true,
  magicLink: false,
  sms: false,
} as const;

export function createCognitoAuthProvider(options: CognitoProviderOptions): AuthProvider {
  const { config } = options;
  const client = options.client ?? buildCognitoClient(config);
  const clientId = config.COGNITO_CLIENT_ID;

  const impl: AuthProviderResult = {
    name: 'cognito',
    capabilities: COGNITO_CAPABILITIES,

    async signUpWithPassword(email: string, password: string) {
      try {
        const { UserSub } = (await client.send(
          new SignUpCommand({
            ClientId: clientId,
            Username: email,
            Password: password,
            UserAttributes: [{ Name: 'email', Value: email }],
          }),
        )) as { UserSub?: string };
        return toSessionResult(
          { id: UserSub ?? email, email },
          UserSub ?? email,
          'Sign up returned no session.',
        );
      } catch (error) {
        return fail('signup_failed', errorMessage(error));
      }
    },

    async signInWithPassword(email: string, password: string) {
      try {
        const auth = (await client.send(
          new InitiateAuthCommand({
            ClientId: clientId,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: { USERNAME: email, PASSWORD: password },
          }),
        )) as { AuthenticationResult?: { AccessToken?: string } };

        const accessToken = auth.AuthenticationResult?.AccessToken;
        if (!accessToken) return fail('signin_failed', 'Cognito returned no access token.');
        const userResult = await resolveUserFromAccessToken(client, accessToken, 'signin_failed');
        if (!userResult.ok) return userResult;
        return toSessionResult(
          { id: userResult.value.id, email: userResult.value.email ?? email },
          accessToken,
          'Sign in returned no session.',
        );
      } catch (error) {
        return fail('signin_failed', errorMessage(error));
      }
    },

    async sendEmailCode(email: string): Promise<Result<true>> {
      try {
        await client.send(
          new ResendConfirmationCodeCommand({ ClientId: clientId, Username: email }),
        );
        return ok(true);
      } catch (error) {
        return fail('otp_send_failed', errorMessage(error));
      }
    },

    async verifyEmailCode(email: string, code: string) {
      try {
        await client.send(
          new ConfirmSignUpCommand({
            ClientId: clientId,
            Username: email,
            ConfirmationCode: code,
          }),
        );
        return toSessionResult(
          { id: email, email },
          `cognito-confirmed:${email}`,
          'Code verified but returned no session.',
        );
      } catch (error) {
        return fail('otp_verify_failed', errorMessage(error));
      }
    },

    async requestPasswordReset(email: string): Promise<Result<true>> {
      try {
        await client.send(new ForgotPasswordCommand({ ClientId: clientId, Username: email }));
        return ok(true);
      } catch (error) {
        return fail('reset_request_failed', errorMessage(error));
      }
    },

    async resetPassword(token: string, newPassword: string) {
      try {
        const [username, code] = token.includes(':') ? token.split(':', 2) : ['', token];
        if (!username) {
          return fail('reset_failed', 'Reset token must be username:code from Cognito flow.');
        }
        await client.send(
          new ConfirmForgotPasswordCommand({
            ClientId: clientId,
            Username: username,
            ConfirmationCode: code,
            Password: newPassword,
          }),
        );
        return toSessionResult(
          { id: username, email: username },
          `cognito-reset:${username}`,
          'Password reset succeeded but returned no session.',
        );
      } catch (error) {
        return fail('reset_failed', errorMessage(error));
      }
    },

    async sendMagicLink(_email: string): Promise<Result<true>> {
      return fail(
        'magic_link_failed',
        'Magic link sign-in is not available on this auth backend — use email code or password.',
      );
    },

    async verifyMagicLink(_token: string) {
      return fail('magic_link_failed', 'Magic link sign-in is not available on this auth backend.');
    },

    async sendSmsCode(_phone: string): Promise<Result<true>> {
      return fail(
        'sms_send_failed',
        'SMS sign-in is not configured — set NOTIFICATIONS_PROVIDER=twilio and Twilio secret settings.',
      );
    },

    async verifySmsCode(_phone: string, _code: string) {
      return fail('sms_verify_failed', 'SMS sign-in is not configured.');
    },

    async getUser(sessionToken: string): Promise<Result<AuthUser>> {
      return resolveUserFromAccessToken(client, sessionToken, 'get_user_failed');
    },
  };
  return toEffectAuthProvider(impl);
}

/** Resolve a Cognito user from an access token via `GetUserCommand`. */
async function resolveUserFromAccessToken(
  client: CognitoClientLike,
  accessToken: string,
  failCode: 'signin_failed' | 'get_user_failed',
): Promise<Result<AuthUser>> {
  try {
    const { Username, UserAttributes } = (await client.send(
      new GetUserCommand({ AccessToken: accessToken }),
    )) as { Username?: string; UserAttributes?: AttributeType[] };

    const attribute = (name: string): string | undefined =>
      UserAttributes?.find((a) => a.Name === name)?.Value;

    // Cognito's stable user id is the `sub` attribute; fall back to `Username` so a
    // pool that aliases the username to email still yields an id.
    return toUserResult(
      { id: attribute('sub') ?? Username, email: attribute('email') },
      'No user for the given access token.',
    );
  } catch (error) {
    return fail(failCode, errorMessage(error));
  }
}

/** Construct the real Cognito client, with explicit creds or the default chain. */
function buildCognitoClient(config: CognitoConfig): CognitoIdentityProviderClient {
  const hasExplicitCredentials =
    config.AWS_ACCESS_KEY_ID !== undefined && config.AWS_SECRET_ACCESS_KEY !== undefined;

  return new CognitoIdentityProviderClient({
    region: config.AWS_REGION,
    ...(hasExplicitCredentials
      ? {
          credentials: {
            // Narrowed to non-null by `hasExplicitCredentials`.
            accessKeyId: config.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY as string,
          },
        }
      : {}),
  });
}

/** Map a raw Cognito user (possibly missing id) to a {@link Result}. */
function toUserResult(
  raw: { id: string | null | undefined; email: string | null | undefined },
  noUserMessage: string,
): Result<AuthUser> {
  const user = normalizeAuthUser({ id: raw.id ?? null, email: raw.email ?? null });
  return user ? ok(user) : fail('no_user', noUserMessage);
}

/** Narrow an unknown caught value to a developer-facing message string. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown Cognito error';
}
