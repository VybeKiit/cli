import process from 'node:process';

const RESET = '\x1b[0m';

/** Cyan-400 to violet-400, matching the landing accent palette. */
const GRADIENT_START = [34, 211, 238] as const;
const GRADIENT_END = [167, 139, 250] as const;

/** Gradient cycle length in character units for the sweep. */
const CYCLE_LENGTH = 24;

/**
 * Build an ANSI truecolor escape sequence.
 *
 * @param r - Red channel from 0 to 255.
 * @param g - Green channel from 0 to 255.
 * @param b - Blue channel from 0 to 255.
 * @returns ANSI foreground color escape sequence.
 * @example
 * rgb(34, 211, 238);
 */
const rgb = (r: number, g: number, b: number): string => `\x1b[38;2;${r};${g};${b}m`;

/**
 * Interpolate a number between two endpoints.
 *
 * @param a - Start value.
 * @param b - End value.
 * @param t - Progress from 0 to 1.
 * @returns Rounded interpolated value.
 * @example
 * lerp(0, 10, 0.5);
 */
const lerp = (a: number, b: number, t: number): number => Math.round(a + (b - a) * t);

/**
 * Resolve the shimmer color for a wave position.
 *
 * @param t - Progress from the gradient start color to the gradient end color.
 * @returns ANSI foreground color escape sequence for the wave position.
 * @example
 * colorAt(0.5);
 */
const colorAt = (t: number): string =>
  rgb(
    lerp(GRADIENT_START[0], GRADIENT_END[0], t),
    lerp(GRADIENT_START[1], GRADIENT_END[1], t),
    lerp(GRADIENT_START[2], GRADIENT_END[2], t),
  );

/**
 * Check whether ANSI color output is allowed.
 *
 * @param env - Process environment used to read color override flags.
 * @param isTTY - Whether stdout is attached to a terminal.
 * @returns True when color is allowed by terminal state and env flags.
 * @example
 * supportsColor({ FORCE_COLOR: '1' }, false);
 */
export const supportsColor = (
  env: NodeJS.ProcessEnv = process.env,
  isTTY: boolean = Boolean(process.stdout.isTTY),
): boolean => {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') {
    return false;
  }
  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '' && env.FORCE_COLOR !== '0') {
    return true;
  }
  return isTTY;
};

/**
 * Apply a moving cyan-to-violet gradient across non-space characters.
 *
 * @param lines - Text lines to color.
 * @param frame - Animation frame offset.
 * @param options - Rendering options for color output.
 * @returns New lines with ANSI color escapes when color is enabled.
 * @example
 * applyShimmerSweep(['VybeKiit'], 2, { color: true });
 */
export const applyShimmerSweep = (
  lines: readonly string[],
  frame: number,
  options?: { color?: boolean },
): string[] => {
  const color = options?.color === undefined ? supportsColor() : options.color;
  if (!color) {
    return [...lines];
  }

  return lines.map((line) => {
    let result = '';
    let charIndex = 0;
    for (const ch of line) {
      if (ch === ' ') {
        result += ch;
      } else {
        const pos = (charIndex + frame) % CYCLE_LENGTH;
        const wave = (Math.sin((pos / CYCLE_LENGTH) * Math.PI * 2) + 1) / 2;
        result += `${colorAt(wave)}${ch}${RESET}`;
        charIndex += 1;
      }
    }
    return result;
  });
};

/** ANSI dim escape sequence used for secondary CLI copy. */
export const DIM = '\x1b[2m';

/**
 * Wait for the requested number of milliseconds.
 *
 * @param ms - Delay in milliseconds.
 * @returns Promise that resolves after the delay.
 * @example
 * await sleep(80);
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
