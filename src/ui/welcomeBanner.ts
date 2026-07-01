import process from 'node:process';
import { applyShimmerSweep, DIM, sleep, supportsColor } from './ansiShimmer';

/** Triple chevron mark + spaced VybeKiit wordmark (mirrors VybeBrandMark). */
export const WELCOME_ART = [
  '        /\\        ',
  '       /  \\       ',
  '      /____\\      ',
  '        ||        ',
  '       /  \\       ',
  '      /____\\      ',
  '        ||        ',
  '       /  \\       ',
  '      /____\\      ',
  '                  ',
  '    V y b e K i i t',
] as const;

export const WELCOME_MOTTO =
  'Ship SaaS and projects like a software engineer — without becoming one.';

const DEFAULT_FRAMES = 12;
const DEFAULT_FRAME_DELAY_MS = 80;

export type WelcomeBannerOptions = {
  readonly frames?: number;
  readonly frameDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly forcePlain?: boolean;
  readonly write?: (text: string) => void;
};

function writeln(write: (text: string) => void, line: string): void {
  write(`${line}\n`);
}

function writeBlock(write: (text: string) => void, lines: readonly string[]): void {
  for (const line of lines) {
    writeln(write, line);
  }
}

/** Play the welcome ASCII art with an animated shimmer, then the brand motto. */
export async function playWelcomeBanner(options: WelcomeBannerOptions = {}): Promise<void> {
  const write = options.write ?? ((text: string) => process.stdout.write(text));
  const sleepFn = options.sleep ?? sleep;
  const frames = options.frames ?? DEFAULT_FRAMES;
  const frameDelayMs = options.frameDelayMs ?? DEFAULT_FRAME_DELAY_MS;
  const art = [...WELCOME_ART];
  const useColor = !options.forcePlain && supportsColor();
  const animate = useColor && Boolean(process.stdout.isTTY) && frames > 0;

  if (!animate) {
    writeBlock(write, art);
    writeln(write, '');
    writeln(write, options.forcePlain ? WELCOME_MOTTO : `${DIM}${WELCOME_MOTTO}\x1b[0m`);
    writeln(write, '');
    return;
  }

  for (let frame = 0; frame < frames; frame += 1) {
    const colored = applyShimmerSweep(art, frame, { color: true });
    if (frame > 0) {
      write(`\x1b[${art.length}A`);
    }
    writeBlock(write, colored);
    if (frame < frames - 1) {
      await sleepFn(frameDelayMs);
    }
  }

  writeln(write, '');
  writeln(write, `${DIM}${WELCOME_MOTTO}\x1b[0m`);
  writeln(write, '');
}

/** Minimum terminal width for the banner art (longest line). */
export function welcomeArtMinWidth(): number {
  return Math.max(...WELCOME_ART.map((line) => line.length));
}
