import process from 'node:process';
import { applyShimmerSweep, DIM, sleep, supportsColor } from './ansiShimmer';

/** Triple chevron mark plus spaced VybeKiit wordmark. */
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

/** Welcome banner motto shown under the wordmark. */
export const WELCOME_MOTTO =
  'Ship SaaS and projects like a software engineer, without becoming one.';

const DEFAULT_FRAMES = 12;
const DEFAULT_FRAME_DELAY_MS = 80;

/** Options that control welcome banner animation and output. */
export type WelcomeBannerOptions = {
  readonly frames?: number;
  readonly frameDelayMs?: number;
  readonly sleep?: (ms: number) => Promise<void>;
  readonly forcePlain?: boolean;
  readonly write?: (text: string) => void;
};

/**
 * Write one line plus a newline to the configured output sink.
 *
 * @param write - Output sink used by the banner renderer.
 * @param line - Line text to write before the newline.
 */
const writeln = (write: (text: string) => void, line: string): void => {
  write(`${line}\n`);
};

/**
 * Write a block of lines to the configured output sink.
 *
 * @param write - Output sink used by the banner renderer.
 * @param lines - Lines to write in order.
 */
const writeBlock = (write: (text: string) => void, lines: readonly string[]): void => {
  for (const line of lines) {
    writeln(write, line);
  }
};

/**
 * Play the welcome ASCII art with an animated shimmer, then the brand motto.
 *
 * @param options - Banner rendering and timing overrides.
 * @returns Promise that resolves after the banner is written.
 */
export const playWelcomeBanner = async (options: WelcomeBannerOptions = {}): Promise<void> => {
  const write =
    options.write === undefined ? (text: string) => process.stdout.write(text) : options.write;
  const sleepFn = options.sleep === undefined ? sleep : options.sleep;
  const frames = options.frames === undefined ? DEFAULT_FRAMES : options.frames;
  const frameDelayMs =
    options.frameDelayMs === undefined ? DEFAULT_FRAME_DELAY_MS : options.frameDelayMs;
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
      // biome-ignore lint/performance/noAwaitInLoops: Banner frames must render sequentially.
      await sleepFn(frameDelayMs);
    }
  }

  writeln(write, '');
  writeln(write, `${DIM}${WELCOME_MOTTO}\x1b[0m`);
  writeln(write, '');
};

/**
 * Measure the minimum terminal width needed to render the banner art.
 *
 * @returns The longest welcome art line length in characters.
 * @example
 * const minWidth = welcomeArtMinWidth();
 */
export const welcomeArtMinWidth = (): number => Math.max(...WELCOME_ART.map((line) => line.length));
