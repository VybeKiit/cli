import type { PreviewMode } from '@library/lib/theme';

export type PreviewThemeMessage = {
  readonly type: 'vk-preview-theme';
  readonly theme: PreviewMode;
  readonly primary: string;
};

/** Push theme + primary into a loaded embed iframe without changing its src. */
export function postPreviewTheme(
  iframe: HTMLIFrameElement | null | undefined,
  theme: PreviewMode,
  primary: string,
): void {
  if (!iframe?.contentWindow) {
    return;
  }
  const message: PreviewThemeMessage = {
    type: 'vk-preview-theme',
    theme,
    primary,
  };
  iframe.contentWindow.postMessage(message, '*');
}

export function isPreviewThemeMessage(data: unknown): data is PreviewThemeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as PreviewThemeMessage).type === 'vk-preview-theme'
  );
}
