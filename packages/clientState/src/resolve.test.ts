import { defaultQueryOptions } from '@vybekiit/client-state/query/client';

import { resolveClientState } from '@vybekiit/client-state/resolve';
import { describe, expect, it } from 'vitest';

describe('resolveClientState', () => {
  it('returns query client + zustand factory for web', () => {
    const state = resolveClientState('web', {});
    expect(state.surface).toBe('web');
    expect(state.queryClient).toBeDefined();
    expect(state.createUiStore).toBeTypeOf('function');
    const store = state.createUiStore();
    expect(store.getState().sidebarCollapsed).toBe(false);
  });

  it('returns MMKV-ready mobile surface config', () => {
    const state = resolveClientState('mobile', { CLIENT_STATE_PERSIST: 'off' });
    expect(state.surface).toBe('mobile');
    expect(state.persistEnabled).toBe(false);
  });

  it('uses configured stale seconds', () => {
    const state = resolveClientState('extension', { CLIENT_STATE_QUERY_STALE_SECONDS: '120' });
    expect(state.queryStaleSeconds).toBe(120);
    expect(state.queryClient.getDefaultOptions().queries?.staleTime).toBe(120_000);
  });
});

describe('query defaults', () => {
  it('is stable across surfaces', () => {
    expect(defaultQueryOptions.queries.retry).toBe(1);
    expect(defaultQueryOptions.queries.refetchOnWindowFocus).toBe(true);
  });
});
