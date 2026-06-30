import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type BetterAuthInstance,
  createBetterAuthProvider,
} from '../src/providers/better-auth/index';

type FakeApi = Record<keyof BetterAuthInstance['api'], ReturnType<typeof vi.fn>>;

function fakeInstance(): { instance: BetterAuthInstance; api: FakeApi } {
  const api: FakeApi = {
    signUpEmail: vi.fn(),
    signInEmail: vi.fn(),
    sendVerificationOTP: vi.fn(),
    signInEmailOTP: vi.fn(),
    getSession: vi.fn(),
  };
  return { instance: { api } as unknown as BetterAuthInstance, api };
}

const config = { BETTER_AUTH_SECRET: 'secret', BETTER_AUTH_URL: 'http://localhost:3000' };
const user = { id: 'u1', email: 'a@b.com' };

let fake: ReturnType<typeof fakeInstance>;

beforeEach(() => {
  fake = fakeInstance();
});

function provider() {
  return createBetterAuthProvider({ config, instance: fake.instance });
}

describe('createBetterAuthProvider', () => {
  it('reports its provider name and capabilities', () => {
    const p = provider();
    expect(p.name).toBe('better-auth');
    expect(p.capabilities.emailCode).toBe(true);
    expect(p.capabilities.magicLink).toBe(false);
  });

  it('signUpWithPassword returns user + bearer token', async () => {
    fake.api.signUpEmail.mockResolvedValue({ token: 't', user });
    const result = await provider().signUpWithPassword('a@b.com', 'pw');

    expect(result.ok && result.value.user).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(result.ok && result.value.sessionToken).toBe('t');
    expect(fake.api.signUpEmail).toHaveBeenCalledWith({
      body: { email: 'a@b.com', password: 'pw', name: 'a' },
    });
  });

  it('signInWithPassword returns user + bearer token', async () => {
    fake.api.signInEmail.mockResolvedValue({ token: 't', user });
    const result = await provider().signInWithPassword('a@b.com', 'pw');

    expect(result.ok && result.value.sessionToken).toBe('t');
    expect(fake.api.signInEmail).toHaveBeenCalledWith({
      body: { email: 'a@b.com', password: 'pw' },
    });
  });

  it('sendEmailCode calls sendVerificationOTP with type sign-in', async () => {
    fake.api.sendVerificationOTP.mockResolvedValue({ success: true });
    const result = await provider().sendEmailCode('a@b.com');

    expect(result.ok).toBe(true);
    expect(fake.api.sendVerificationOTP).toHaveBeenCalledWith({
      body: { email: 'a@b.com', type: 'sign-in' },
    });
  });

  it('verifyEmailCode returns session with token', async () => {
    fake.api.signInEmailOTP.mockResolvedValue({ token: 't', user });
    const result = await provider().verifyEmailCode('a@b.com', '123456');

    expect(result.ok && result.value.sessionToken).toBe('t');
    expect(fake.api.signInEmailOTP).toHaveBeenCalledWith({
      body: { email: 'a@b.com', otp: '123456' },
    });
  });

  it('getUser resolves the session via a Bearer header', async () => {
    fake.api.getSession.mockResolvedValue({ user });
    const result = await provider().getUser('sess_token');

    expect(result.ok && result.value).toEqual({ id: 'u1', email: 'a@b.com' });
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
    const signup = await p.signUpWithPassword('a@b.com', 'pw');
    const signin = await p.signInWithPassword('a@b.com', 'pw');
    const send = await p.sendEmailCode('a@b.com');
    const verify = await p.verifyEmailCode('a@b.com', '000000');
    const get = await p.getUser('t');

    expect(!signup.ok && signup.error.code).toBe('signup_failed');
    expect(!signin.ok && signin.error.code).toBe('signin_failed');
    expect(!send.ok && send.error.code).toBe('otp_send_failed');
    expect(!verify.ok && verify.error.code).toBe('otp_verify_failed');
    expect(!get.ok && get.error.code).toBe('get_user_failed');
  });

  it('returns no_user when sign-in succeeds without user or token', async () => {
    fake.api.signInEmail.mockResolvedValue({ token: undefined, user: undefined });
    const result = await provider().signInWithPassword('a@b.com', 'pw');
    expect(!result.ok && result.error.code).toBe('no_user');
  });
});
