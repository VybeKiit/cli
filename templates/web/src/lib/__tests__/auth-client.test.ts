import {
  sendEmailCode,
  signInWithPassword,
  signUpWithPassword,
  verifyEmailCode,
} from '@/lib/auth-client';
import { startCheckout } from '@/lib/billing-client';
import type { AuthUser } from '@vybekiit/auth';

/**
 * Critical-path coverage for the buyer-facing wire points once they call real
 * server routes. The routes themselves run `resolveAuthProvider()` /
 * `resolvePaymentProvider()` — which on a fresh scaffold is the local dev adapter
 * (ADR-0008) — so here we mock `fetch` to stand in for those routes and prove the
 * clients now succeed (no more `not_configured` stub) and validate inputs up front.
 */

/** Build a minimal `Response`-like stub for the global fetch mock. */
function fetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const DEV_USER: AuthUser = { id: 'local-dev-user', email: 'you@local.dev' };

describe('auth-client over the server routes', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('signInWithPassword returns the user the route resolved', async () => {
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(200, DEV_USER));
    const result = await signInWithPassword('you@local.dev', 'whatever');
    expect(result.ok && result.value).toEqual(DEV_USER);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signin', expect.any(Object));
  });

  it('signUpWithPassword returns the user the route resolved', async () => {
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(200, DEV_USER));
    const result = await signUpWithPassword('you@local.dev', 'whatever');
    expect(result.ok && result.value).toEqual(DEV_USER);
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', expect.any(Object));
  });

  it('sendEmailCode succeeds when the route accepts the request', async () => {
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(200, { ok: true }));
    const result = await sendEmailCode('you@local.dev');
    expect(result.ok && result.value).toBe(true);
  });

  it('verifyEmailCode returns the signed-in user', async () => {
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(200, DEV_USER));
    const result = await verifyEmailCode('you@local.dev', '000000');
    expect(result.ok && result.value).toEqual(DEV_USER);
  });

  it('validates input before hitting the network', async () => {
    const result = await signInWithPassword('', '');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('surfaces a route failure as a Result error (not a throw)', async () => {
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(401, { error: 'Wrong password.' }));
    const result = await signInWithPassword('you@local.dev', 'nope');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toBe('Wrong password.');
  });
});

describe('billing-client over the checkout route', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('startCheckout returns the provider checkout url', async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      fetchResponse(200, { url: 'https://pay.example/c/1' }),
    );
    const result = await startCheckout('plan_pro');
    expect(result.ok && result.value).toEqual({ url: 'https://pay.example/c/1' });
    expect(global.fetch).toHaveBeenCalledWith('/api/checkout', expect.any(Object));
  });

  it('requires a plan id before hitting the network', async () => {
    const result = await startCheckout('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
