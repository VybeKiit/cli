import type { UiStore, UiStoreState } from '@vybekiit/client-state/types';
import { create } from 'zustand';

/**
 * Create the shared Zustand UI store for generated templates.
 *
 * @returns Bound Zustand store with the default UI-only state.
 * @example
 * const store = createUiStore();
 */
export const createUiStore = (): UiStore =>
  create<UiStoreState>((set) => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  }));
