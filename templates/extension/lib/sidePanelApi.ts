import { browser } from 'wxt/browser';

export type SidePanelMessage =
  | { type: 'OPEN_SIDE_PANEL'; windowId?: number }
  | { type: 'TOGGLE_SIDE_PANEL'; windowId?: number };

/** Open the Chrome side panel for the current window (requires `sidePanel` permission). */
export async function openSidePanel(): Promise<boolean> {
  try {
    const current = await browser.windows.getCurrent();
    const windowId = current.id;
    if (windowId === undefined) return false;
    await browser.sidePanel.open({ windowId });
    return true;
  } catch {
    return false;
  }
}

/** Message the background worker to open the side panel (same-window API). */
export async function requestOpenSidePanel(): Promise<boolean> {
  try {
    const current = await browser.windows.getCurrent();
    const response = (await browser.runtime.sendMessage({
      type: 'OPEN_SIDE_PANEL',
      windowId: current.id,
    } satisfies SidePanelMessage)) as { ok?: boolean } | undefined;
    return response?.ok === true;
  } catch {
    return openSidePanel();
  }
}

/** Alias — Chrome side panel API opens the panel (no true close toggle from extension UI). */
export async function toggleSidePanel(): Promise<boolean> {
  return requestOpenSidePanel();
}
