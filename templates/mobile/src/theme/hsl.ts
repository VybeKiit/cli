/**
 * Convert a shared token's HSL channel string into a React Native color string.
 *
 * The `@vybekiit/tokens` palette stores colors channel-only and space-separated
 * (e.g. `'0 0% 100%'`) so the web side can drop them into `hsl(var(--x))`. React
 * Native's color parser, however, only accepts the COMMA form `hsl(H, S%, L%)` —
 * the space-separated CSS Color 4 syntax silently fails there. This is the one
 * seam that bridges that gap, so every mobile primitive reads tokens through it
 * (via {@link useTheme}) and never hand-writes a color.
 *
 * @param channels - raw HSL channels as stored in the tokens palette,
 *   `'<hue> <sat>% <light>%'` (the `tokens.hsl()` input shape).
 * @returns an RN-safe `hsl(h, s%, l%)` string.
 * @throws if `channels` is not three space-separated parts — a malformed token is
 *   a build-time mistake we want to surface loudly, not paint with a wrong color.
 */
export function toRnHsl(channels: string): string {
  const parts = channels.trim().split(/\s+/);
  if (parts.length !== 3) {
    throw new Error(`Invalid HSL channels: "${channels}" (expected "<h> <s>% <l>%")`);
  }
  const [hue, saturation, lightness] = parts;
  return `hsl(${hue}, ${saturation}, ${lightness})`;
}
