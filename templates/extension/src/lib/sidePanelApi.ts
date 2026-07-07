import { browser } from 'wxt/browser';

export type SidePanelMessage =
  | { type: 'OPEN_SIDE_PANEL'; windowId?: number }
  | { type: 'TOGGLE_SIDE_PANEL'; windowId?: number };

/**
 * Open the Chrome side panel for the current window.
 *
 * @returns True when Chrome accepted the side-panel open request.
 * @example
 * const opened = await openSidePanel();
 */
export const openSidePanel = async (): Promise<boolean> => {
  try {
    const current = await browser.windows.getCurrent();
    const windowId = current.id;
    if (windowId === undefined) return false;
    await browser.sidePanel.open({ windowId });
    return true;
  } catch {
    return false;
  }
};

/**
 * Ask the background worker to open the side panel.
 *
 * @returns True when the background worker or direct API opened the panel.
 * @example
 * const opened = await requestOpenSidePanel();
 */
export const requestOpenSidePanel = async (): Promise<boolean> => {
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
};

/**
 * Open the side panel through the toggle affordance.
 *
 * @returns True when the side panel opened.
 * @example
 * const toggled = await toggleSidePanel();
 */
export const toggleSidePanel = async (): Promise<boolean> => requestOpenSidePanel();
