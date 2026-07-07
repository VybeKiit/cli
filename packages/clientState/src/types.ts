import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

/** Client runtime surface that selects persistence and cache behavior. */
export type ClientStateSurface = 'web' | 'mobile' | 'extension' | 'spa';

/** Zustand UI-only state shared by the generated templates. */
export type UiStoreState = {
  /** Example UI-only slice — templates extend via createUiStore options. */
  readonly sidebarCollapsed: boolean;
  readonly setSidebarCollapsed: (collapsed: boolean) => void;
};

/** Bound Zustand UI store returned to template composition roots. */
export type UiStore = UseBoundStore<StoreApi<UiStoreState>>;

/** Resolved client-state services for a template surface. */
export type ResolvedClientState = {
  readonly createUiStore: () => UiStore;
  readonly persistEnabled: boolean;
  readonly queryClient: QueryClient;
  readonly queryStaleSeconds: number;
  readonly surface: ClientStateSurface;
};

/** Component props for a surface-specific client-state provider. */
export interface ClientStateProviderProps {
  readonly children: ReactNode;
  readonly surface: ClientStateSurface;
}
