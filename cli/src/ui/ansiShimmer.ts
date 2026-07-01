import process from 'node:process';

const RESET = '\x1b[0m';

/** Cyan-400 → violet-400 (matches landing accent palette). */
const GRADIENT_START = [34, 211, 238] as const;
const GRADIENT_END = [167, 139, 250] as const;

/** Gradient cycle length in character units for the sweep. */
const CYCLE_LENGTH = 24;

function rgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function colorAt(t: number): string {
  return rgb(
    lerp(GRADIENT_START[0], GRADIENT_END[0], t),
    lerp(GRADIENT_START[1], GRADIENT_END[1], t),
    lerp(GRADIENT_START[2], GRADIENT_END[2], t),
  );
}

/** True when ANSI color output is allowed (TTY unless forced, never when NO_COLOR is set). */
export function supportsColor(
  env: NodeJS.ProcessEnv = process.env,
  isTTY: boolean = Boolean(process.stdout.isTTY),
): boolean {
  if (env.NO_COLOR !== undefined && env.NO_COLOR !== '') {
    return false;
  }
  if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== '' && env.FORCE_COLOR !== '0') {
    return true;
  }
  return isTTY;
}

/** Apply a moving cyan→violet gradient across non-space characters. */
export function applyShimmerSweep(
  lines: readonly string[],
  frame: number,
  options?: { color?: boolean },
): string[] {
  const color = options?.color ?? supportsColor();
  if (!color) {
    return [...lines];
  }

  return lines.map((line) => {
    let result = '';
    let charIndex = 0;
    for (const ch of line) {
      if (ch === ' ') {
        result += ch;
        continue;
      }
      const pos = (charIndex + frame) % CYCLE_LENGTH;
      const wave = (Math.sin((pos / CYCLE_LENGTH) * Math.PI * 2) + 1) / 2;
      result += `${colorAt(wave)}${ch}${RESET}`;
      charIndex += 1;
    }
    return result;
  });
}

export const DIM = '\x1b[2m';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
