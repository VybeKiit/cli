// "0 0% 100%" -> ["0", "0%", "100%"]
const HSL_CHANNEL_SEPARATOR = /\s+/;

/**
 * Convert a shared token's HSL channel string into a React Native color string.
 *
 * The `@vybekiit/tokens` palette stores colors channel-only and space-separated
 * (e.g. `'0 0% 100%'`) so the web side can drop them into `hsl(var(--x))`. React
 * Native's color parser, however, only accepts the comma form `hsl(H, S%, L%)`.
 * The space-separated CSS Color 4 syntax silently fails there. This is the one
 * seam that bridges that gap, so every mobile primitive reads tokens through it
 * (via {@link useTheme}) and never hand-writes a color.
 *
 * @param channels - raw HSL channels as stored in the tokens palette,
 *   `'<hue> <sat>% <light>%'` (the `tokens.hsl()` input shape).
 * @returns an RN-safe `hsl(h, s%, l%)` string.
 * @throws if `channels` is not three space-separated parts; a malformed token is
 *   a build-time mistake we want to surface loudly, not paint with a wrong color.
 * @example
 * const color = toRnHsl('0 0% 100%');
 */
export const toRnHsl = (channels: string): string => {
  const parts = channels.trim().split(HSL_CHANNEL_SEPARATOR);
  if (parts.length !== 3) {
    throw new Error(`Invalid HSL channels: "${channels}" (expected "<h> <s>% <l>%")`);
  }
  const [hue, saturation, lightness] = parts;
  return `hsl(${hue}, ${saturation}, ${lightness})`;
};
