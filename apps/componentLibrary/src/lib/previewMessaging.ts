import type { PreviewMode } from '@library/lib/theme';

export type PreviewThemeMessage = {
  readonly type: 'vk-preview-theme';
  readonly theme: PreviewMode;
  readonly primary: string;
};

/**
 * Post preview theme.
 *
 * @param iframe - Preview iframe that receives the theme message.
 * @param theme - Input passed to this theme parameter.
 * @param primary - Primary theme color to apply.
 * @returns Nothing; the helper updates browser state or notifies subscribers.
 * @example
 * postPreviewTheme(iframe, theme, '#14b8a6');
 */
export const postPreviewTheme = (
  iframe: HTMLIFrameElement | null | undefined,
  theme: PreviewMode,
  primary: string,
): void => {
  if (!iframe?.contentWindow) {
    return;
  }
  const message: PreviewThemeMessage = {
    type: 'vk-preview-theme',
    theme,
    primary,
  };
  iframe.contentWindow.postMessage(message, '*');
};

/**
 * Is preview theme message.
 *
 * @param data - Unknown browser message payload to validate.
 * @returns The value produced by isPreviewThemeMessage.
 * @example
 * const result = isPreviewThemeMessage(message.data);
 */
export const isPreviewThemeMessage = (data: unknown): data is PreviewThemeMessage =>
  typeof data === 'object' &&
  data !== null &&
  (data as PreviewThemeMessage).type === 'vk-preview-theme';
