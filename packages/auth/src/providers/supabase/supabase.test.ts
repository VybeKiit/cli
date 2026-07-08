import {
  createSupabaseAuthProvider,
  type SupabaseAuthClientLike,
} from '@vybekiit/auth/providers/supabase';
import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const config = { SUPABASE_URL: 'https://demo.supabase.co', SUPABASE_ANON_KEY: 'anon-key' };
const user = { id: 'u1', email: 'a@b.com' };
const session = { access_token: 'tok' };

/** A fake GoTrue `auth` client whose methods are mocked — no network, no real client. */
const fakeClient = () => {
  const auth = {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    getUser: vi.fn(),
  };
  return { client: { auth } as unknown as SupabaseAuthClientLike, auth };
};

let fake: ReturnType<typeof fakeClient>;

beforeEach(() => {
  fake = fakeClient();
});

const provider = () => createSupabaseAuthProvider({ config, client: fake.client });

describe('createSupabaseAuthProvider', () => {
  it('reports its provider name and full capabilities', () => {
    const p = provider();
    expect(p.name).toBe('supabase');
    expect(p.capabilities.magicLink).toBe(true);
    expect(p.capabilities.sms).toBe(true);
  });

  it('signUpWithPassword returns the created user + bearer token', async () => {
    fake.auth.signUp.mockResolvedValue({ data: { user, session }, error: null });
    const result = await Effect.runPromise(provider().signUpWithPassword('a@b.com', 'pw'));

    expect(result.sessionToken).toBe('tok');
    expect(result.user).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(fake.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
  });

  it('signInWithPassword returns the session', async () => {
    fake.auth.signInWithPassword.mockResolvedValue({ data: { user, session }, error: null });
    const result = await Effect.runPromise(provider().signInWithPassword('a@b.com', 'pw'));

    expect(result.sessionToken).toBe('tok');
    expect(fake.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
  });

  it('sendEmailCode calls signInWithOtp by email', async () => {
    fake.auth.signInWithOtp.mockResolvedValue({ error: null });
    const value = await Effect.runPromise(provider().sendEmailCode('a@b.com'));

    expect(value).toBe(true);
    expect(fake.auth.signInWithOtp).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('verifyEmailCode verifies the email OTP and returns a session', async () => {
    fake.auth.verifyOtp.mockResolvedValue({ data: { user, session }, error: null });
    const result = await Effect.runPromise(provider().verifyEmailCode('a@b.com', '123456'));

    expect(result.sessionToken).toBe('tok');
    expect(fake.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'a@b.com',
      token: '123456',
      type: 'email',
    });
  });

  it('verifySmsCode verifies the phone OTP', async () => {
    fake.auth.verifyOtp.mockResolvedValue({ data: { user, session }, error: null });
    const result = await Effect.runPromise(provider().verifySmsCode('+15551234567', '000000'));

    expect(result.sessionToken).toBe('tok');
    expect(fake.auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+15551234567',
      token: '000000',
      type: 'sms',
    });
  });

  it('resetPassword verifies the recovery token then updates the password', async () => {
    fake.auth.verifyOtp.mockResolvedValue({ data: { user, session }, error: null });
    fake.auth.updateUser.mockResolvedValue({ data: { user, session }, error: null });
    const result = await Effect.runPromise(provider().resetPassword('recovery-hash', 'newpw'));

    expect(result.sessionToken).toBe('tok');
    expect(fake.auth.verifyOtp).toHaveBeenCalledWith({
      token_hash: 'recovery-hash',
      type: 'recovery',
    });
    expect(fake.auth.updateUser).toHaveBeenCalledWith({ password: 'newpw' });
  });

  it('getUser resolves the user from the access token', async () => {
    fake.auth.getUser.mockResolvedValue({ data: { user }, error: null });
    const result = await Effect.runPromise(provider().getUser('tok'));

    expect(result).toEqual({ id: 'u1', email: 'a@b.com' });
    expect(fake.auth.getUser).toHaveBeenCalledWith('tok');
  });

  it('maps a GoTrue error to the right fail code per method', async () => {
    fake.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'bad credentials' },
    });
    fake.auth.signInWithOtp.mockResolvedValue({ error: { message: 'rate limited' } });
    fake.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no session' } });

    const p = provider();
    const signin = await Effect.runPromise(Effect.flip(p.signInWithPassword('a@b.com', 'pw')));
    const sent = await Effect.runPromise(Effect.flip(p.sendEmailCode('a@b.com')));
    const get = await Effect.runPromise(Effect.flip(p.getUser('t')));

    expect(signin.code).toBe('signin_failed');
    expect(sent.code).toBe('otp_send_failed');
    expect(get.code).toBe('get_user_failed');
  });
});
