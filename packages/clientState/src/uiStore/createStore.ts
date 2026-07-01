import { create } from 'zustand';

import type { UiStore, UiStoreState } from '../types';

export function createUiStore(): UiStore {
  return create<UiStoreState>((set) => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  }));
}
