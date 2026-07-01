import { useUser } from '@/hooks/use-user';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { AuthUser } from '@vybekiit/auth';
import { createElement, type ReactNode } from 'react';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

/** Build a minimal `Response`-like stub for the global fetch mock. */
function fetchResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('useUser', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('resolves to user: null when the endpoint 404s (pre sign-in wiring)', async () => {
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(404, { error: 'Not found' }));
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('populates the user when the endpoint returns one', async () => {
    const user: AuthUser = { id: 'u_1', email: 'builder@example.com' };
    vi.mocked(global.fetch).mockResolvedValue(fetchResponse(200, user));
    const { result } = renderHook(() => useUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(user);
  });
});
