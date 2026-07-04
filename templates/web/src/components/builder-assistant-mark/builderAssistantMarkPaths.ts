/** Claude Code TUI creature — blocky octopus/robot with eye cutouts (viewBox 0 0 24 24). */
export const CLAUDE_CODE_OCTOPUS_PATH =
  'M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0v-3.1h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z';

/** Eye cutout geometry — used for wink eyelid overlays. */
export const CLAUDE_CODE_OCTOPUS_EYES = {
  left: { x: 6, y: 8.102, width: 1.488, height: 2.847 },
  right: { x: 16.51, y: 8.102, width: 1.49, height: 2.847 },
} as const;

/** Sad-face overlays — brows, mouth, and tear drops (viewBox 0 0 24 24). */
export const CLAUDE_CODE_SAD_FACE = {
  mouth: 'M10.05 12.95 Q12 11.55 13.95 12.95',
  leftBrow: 'M5.45 7.75 L7.35 8.35',
  rightBrow: 'M18.55 7.75 L16.65 8.35',
  leftTear: { cx: 5.65, cy: 11.35, rx: 0.34, ry: 0.52 },
  rightTear: { cx: 18.35, cy: 11.35, rx: 0.34, ry: 0.52 },
} as const;

/** Claude Code TUI accent — fixed rust/orange from the terminal splash. */
export const CLAUDE_CODE_BRAND_HEX = '#D97757';

/** Official Clawd eyes are solid near-black squares (not hollow cutouts). */
export const CLAUDE_CODE_OCTOPUS_EYE_INK = '#1C1917';

/** Cloud silhouette for the Codex CLI mark (viewBox 0 0 24 24). */
export const CODEX_CLOUD_PATH =
  'M12 3.15C9.05 3.15 6.85 4.95 6.25 7.35C4.05 7.75 2.65 9.55 2.65 11.75C2.65 14.05 3.85 16.05 5.85 17.05C6.65 19.45 8.85 21.05 11.65 21.05C12.45 21.05 13.25 20.85 14.05 20.65C16.45 21.25 18.85 20.05 19.85 18.05C21.65 17.45 22.85 15.45 22.85 13.15C22.85 10.85 21.65 8.85 19.65 8.05C19.25 5.45 16.65 3.15 12 3.15Z';
