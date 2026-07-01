import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import type { SidePanelMessage } from '@/lib/side-panel-api';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void browser.sidePanel
      .setOptions({ path: 'sidepanel.html', enabled: true })
      .catch(() => undefined);
  });

  browser.runtime.onMessage.addListener((message: SidePanelMessage, _sender, sendResponse) => {
    if (message?.type === 'OPEN_SIDE_PANEL' || message?.type === 'TOGGLE_SIDE_PANEL') {
      const windowId = message.windowId;
      if (windowId === undefined) {
        sendResponse({ ok: false });
        return true;
      }
      void browser.sidePanel
        .open({ windowId })
        .then(() => sendResponse({ ok: true }))
        .catch(() => sendResponse({ ok: false }));
      return true;
    }
  });
});
