import {
  type BetterAuthInstance,
  createBetterAuthProvider,
} from '@vybekiit/auth/providers/betterAuth';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type FakeApi = Record<keyof BetterAuthInstance['api'], ReturnType<typeof vi.fn>>;

const fakeInstance = (): { instance: BetterAuthInstance; api: FakeApi } => {
  const api: FakeApi = {
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    sendVerificationOTP: vi.fn(),
    signInEmailOTP: vi.fn(),
    getSession: vi.fn(),
  };
  return { instance: { api } as unknown as BetterAuthInstance, api };
};

const config = { BETTER_AUTH_SECRET: 'secret', BETTER_AUTH_URL: 'http://localhost:3000' };
const user = { id: 'u1', email: 'a@b.com' };

let fake: ReturnType<typeof fakeInstance>;

beforeEach(() => {
  fake = fakeInstance();
});

const provider = () => createBetterAuthProvider({ config, instance: fake.instance });

describe('createBetterAuthProvider', () => {
  it('reports its provider name and capabilities', () => {
    const p = provider();
    expect(p.name).toBe('better-auth');
    expect(p.capabilities.emailCode).toBe(true);
    expect(p.capabilities.magicLink).toBe(false);
  });

  it('signUpWithPassword returns user + bearer token', async () => {
    fake.api.signUpEmail.mockResolvedValue({ token: 't', user });
    const session = await Effect.runPromise(provider().signUpWithPassword('a@b.com', 'pw'));

    expect(session.user).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(session.sessionToken).toBe('t');
    expect(fake.api.signUpEmail).toHaveBeenCalledWith({
      body: { email: 'a@b.com', password: 'pw', name: 'a' },
    });
  });

  it('signInWithPassword returns user + bearer token', async () => {
    fake.api.signInEmail.mockResolvedValue({ token: 't', user });
    const session = await Effect.runPromise(provider().signInWithPassword('a@b.com', 'pw'));

    expect(session.sessionToken).toBe('t');
    expect(fake.api.signInEmail).toHaveBeenCalledWith({
      body: { email: 'a@b.com', password: 'pw' },
    });
  });

  it('sendEmailCode calls sendVerificationOTP with type sign-in', async () => {
    fake.api.sendVerificationOTP.mockResolvedValue({ success: true });
    const value = await Effect.runPromise(provider().sendEmailCode('a@b.com'));

    expect(value).toBe(true);
    expect(fake.api.sendVerificationOTP).toHaveBeenCalledWith({
      body: { email: 'a@b.com', type: 'sign-in' },
    });
  });

  it('verifyEmailCode returns session with token', async () => {
    fake.api.signInEmailOTP.mockResolvedValue({ token: 't', user });
    const session = await Effect.runPromise(provider().verifyEmailCode('a@b.com', '123456'));

    expect(session.sessionToken).toBe('t');
    expect(fake.api.signInEmailOTP).toHaveBeenCalledWith({
      body: { email: 'a@b.com', otp: '123456' },
    });
  });

  it('getUser resolves the session via a Bearer header', async () => {
    fake.api.getSession.mockResolvedValue({ user });
    const authUser = await Effect.runPromise(provider().getUser('sess_token'));

    expect(authUser).toEqual({ id: 'u1', email: 'a@b.com' });
    const headers = fake.api.getSession.mock.calls[0]?.[0]?.headers as Headers;
    expect(headers.get('authorization')).toBe('Bearer sess_token');
  });

  it('maps a thrown APIError to the right fail code per method', async () => {
    fake.api.signUpEmail.mockRejectedValue(new Error('email taken'));
    fake.api.signInEmail.mockRejectedValue(new Error('bad password'));
    fake.api.sendVerificationOTP.mockRejectedValue(new Error('rate limited'));
    fake.api.signInEmailOTP.mockRejectedValue(new Error('expired code'));
    fake.api.getSession.mockRejectedValue(new Error('no session'));

    const p = provider();
    const signup = await Effect.runPromise(Effect.flip(p.signUpWithPassword('a@b.com', 'pw')));
    const signin = await Effect.runPromise(Effect.flip(p.signInWithPassword('a@b.com', 'pw')));
    const sent = await Effect.runPromise(Effect.flip(p.sendEmailCode('a@b.com')));
    const verify = await Effect.runPromise(Effect.flip(p.verifyEmailCode('a@b.com', '000000')));
    const get = await Effect.runPromise(Effect.flip(p.getUser('t')));

    expect(signup.code).toBe('signup_failed');
    expect(signin.code).toBe('signin_failed');
    expect(sent.code).toBe('otp_send_failed');
    expect(verify.code).toBe('otp_verify_failed');
    expect(get.code).toBe('get_user_failed');
  });

  it('returns no_user when sign-in succeeds without user or token', async () => {
    fake.api.signInEmail.mockResolvedValue({ token: undefined, user: undefined });
    const error = await Effect.runPromise(
      Effect.flip(provider().signInWithPassword('a@b.com', 'pw')),
    );
    expect(error.code).toBe('no_user');
  });
});
