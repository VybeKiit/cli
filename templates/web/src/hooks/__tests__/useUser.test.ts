import { useUser } from '@/hooks/useUser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AuthUser } from '@vybekiit/auth';
import { createElement, type ReactNode } from 'react';
import { vi } from 'vitest';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { readonly children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  return wrapper;
};

/** Build a minimal `Response`-like stub for the global fetch mock. */
const fetchResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }) as Response;

describe('useUser', () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn<typeof fetch>();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('resolves to user: null when the endpoint 404s (pre sign-in wiring)', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(fetchResponse(404, { error: 'Not found' }));
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('populates the user when the endpoint returns one', async () => {
    const user: AuthUser = { id: 'u_1', email: 'builder@example.com' };
    vi.mocked(globalThis.fetch).mockResolvedValue(fetchResponse(200, user));
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(user);
  });
});
