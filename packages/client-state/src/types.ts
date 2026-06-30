import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

export type ClientStateSurface = 'web' | 'mobile' | 'extension' | 'spa';

export type UiStoreState = {
  /** Example UI-only slice — templates extend via createUiStore options. */
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export type UiStore = UseBoundStore<StoreApi<UiStoreState>>;

export type ResolvedClientState = {
  persistEnabled: boolean;
  queryClient: QueryClient;
  queryStaleSeconds: number;
  createUiStore: () => UiStore;
  surface: ClientStateSurface;
};

export type ClientStateProviderProps = {
  children: ReactNode;
  surface: ClientStateSurface;
};
