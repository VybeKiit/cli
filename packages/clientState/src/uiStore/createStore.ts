import type { UiStore, UiStoreState } from '@vybekiit/clientState/types';
import { create } from 'zustand';

export function createUiStore(): UiStore {
  return create<UiStoreState>((set) => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  }));
}
