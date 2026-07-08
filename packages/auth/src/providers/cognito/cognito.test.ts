import { createCognitoAuthProvider } from '@vybekiit/auth/providers/cognito';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Fake Cognito command classes that capture their `input` and tag a `type`, so a test
 * can assert which command the adapter issued and with what payload. `send` is the
 * injected fake (no network); `vi.hoisted` keeps the refs available to `vi.mock`.
 */
const command = vi.hoisted(() => {
  const make = (type: string) =>
    class {
      readonly input: Record<string, unknown>;
      readonly type = type;
      constructor(input: Record<string, unknown>) {
        this.input = input;
      }
    };
  return {
    SignUpCommand: make('SignUp'),
    InitiateAuthCommand: make('InitiateAuth'),
    ResendConfirmationCodeCommand: make('ResendConfirmationCode'),
    ConfirmSignUpCommand: make('ConfirmSignUp'),
    GetUserCommand: make('GetUser'),
  };
});

vi.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: class {},
  ...command,
}));

const config = {
  COGNITO_USER_POOL_ID: 'pool',
  COGNITO_CLIENT_ID: 'client',
  AWS_REGION: 'us-east-1',
};

/** A typed view of one issued command for assertions. */
type Issued = { type: string; input: Record<string, unknown> };

let send: ReturnType<typeof vi.fn>;

beforeEach(() => {
  send = vi.fn();
});

const provider = () => createCognitoAuthProvider({ config, client: { send } });

const issued = (index: number): Issued => send.mock.calls[index]?.[0] as Issued;

describe('createCognitoAuthProvider', () => {
  it('reports its provider name', () => {
    expect(provider().name).toBe('cognito');
  });

  it('signUpWithPassword issues SignUpCommand and maps UserSub to id', async () => {
    send.mockResolvedValue({ UserSub: 'sub-1' });
    const session = await Effect.runPromise(provider().signUpWithPassword('a@b.com', 'pw'));

    expect(session.user).toEqual({ id: 'sub-1', email: 'a@b.com' });
    expect(session.sessionToken).toBe('sub-1');
    expect(issued(0).type).toBe('SignUp');
    expect(issued(0).input).toMatchObject({
      ClientId: 'client',
      Username: 'a@b.com',
      Password: 'pw',
    });
  });

  it('signInWithPassword issues InitiateAuth then GetUser, mapping sub + email', async () => {
    send
      .mockResolvedValueOnce({ AuthenticationResult: { AccessToken: 'acc' } })
      .mockResolvedValueOnce({
        Username: 'a@b.com',
        UserAttributes: [
          { Name: 'sub', Value: 'sub-9' },
          { Name: 'email', Value: 'a@b.com' },
        ],
      });

    const session = await Effect.runPromise(provider().signInWithPassword('a@b.com', 'pw'));

    expect(session.user).toEqual({ id: 'sub-9', email: 'a@b.com' });
    expect(session.sessionToken).toBe('acc');
    expect(issued(0).type).toBe('InitiateAuth');
    expect(issued(0).input).toMatchObject({ AuthFlow: 'USER_PASSWORD_AUTH' });
    expect(issued(1).type).toBe('GetUser');
    expect(issued(1).input).toEqual({ AccessToken: 'acc' });
  });

  it('signInWithPassword fails when Cognito returns no access token', async () => {
    send.mockResolvedValue({ AuthenticationResult: {} });
    const error = await Effect.runPromise(
      Effect.flip(provider().signInWithPassword('a@b.com', 'pw')),
    );
    expect(error.code).toBe('signin_failed');
  });

  it('sendEmailCode issues ResendConfirmationCode', async () => {
    send.mockResolvedValue({});
    const value = await Effect.runPromise(provider().sendEmailCode('a@b.com'));

    expect(value).toBe(true);
    expect(issued(0).type).toBe('ResendConfirmationCode');
    expect(issued(0).input).toMatchObject({ ClientId: 'client', Username: 'a@b.com' });
  });

  it('verifyEmailCode issues ConfirmSignUp and keys the user by email', async () => {
    send.mockResolvedValue({});
    const session = await Effect.runPromise(provider().verifyEmailCode('a@b.com', '123456'));

    expect(session.user).toEqual({ id: 'a@b.com', email: 'a@b.com' });
    expect(issued(0).type).toBe('ConfirmSignUp');
    expect(issued(0).input).toMatchObject({ Username: 'a@b.com', ConfirmationCode: '123456' });
  });

  it('getUser issues GetUserCommand with the access token', async () => {
    send.mockResolvedValue({
      Username: 'a@b.com',
      UserAttributes: [
        { Name: 'sub', Value: 'sub-3' },
        { Name: 'email', Value: 'a@b.com' },
      ],
    });
    const user = await Effect.runPromise(provider().getUser('acc-token'));

    expect(user).toEqual({ id: 'sub-3', email: 'a@b.com' });
    expect(issued(0).type).toBe('GetUser');
    expect(issued(0).input).toEqual({ AccessToken: 'acc-token' });
  });

  it('maps an SDK error to the right fail code per method', async () => {
    send.mockRejectedValue(new Error('cognito boom'));
    const p = provider();

    const signup = await Effect.runPromise(Effect.flip(p.signUpWithPassword('a@b.com', 'pw')));
    const sent = await Effect.runPromise(Effect.flip(p.sendEmailCode('a@b.com')));
    const verify = await Effect.runPromise(Effect.flip(p.verifyEmailCode('a@b.com', '0')));
    const get = await Effect.runPromise(Effect.flip(p.getUser('t')));

    expect(signup.code).toBe('signup_failed');
    expect(sent.code).toBe('otp_send_failed');
    expect(verify.code).toBe('otp_verify_failed');
    expect(get.code).toBe('get_user_failed');
  });
});
