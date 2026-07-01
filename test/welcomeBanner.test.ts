import { describe, expect, it } from 'vitest';
import { applyShimmerSweep, supportsColor } from '../src/ui/ansiShimmer';
import {
  playWelcomeBanner,
  WELCOME_ART,
  WELCOME_MOTTO,
  welcomeArtMinWidth,
} from '../src/ui/welcomeBanner';

describe('supportsColor', () => {
  it('returns false when NO_COLOR is set', () => {
    expect(supportsColor({ NO_COLOR: '1' }, true)).toBe(false);
  });

  it('returns true when FORCE_COLOR is set even without TTY', () => {
    expect(supportsColor({ FORCE_COLOR: '1' }, false)).toBe(true);
  });

  it('returns true for TTY when color is not disabled', () => {
    expect(supportsColor({}, true)).toBe(true);
    expect(supportsColor({}, false)).toBe(false);
  });
});

describe('applyShimmerSweep', () => {
  const lines = ['  /\\  ', ' /  \\ '];

  it('returns plain lines when color is disabled', () => {
    expect(applyShimmerSweep(lines, 3, { color: false })).toEqual(lines);
  });

  it('wraps non-space characters in ANSI color codes', () => {
    const [first] = applyShimmerSweep(lines, 0, { color: true });
    expect(first).toContain('\x1b[38;2;');
    expect(first).toContain('\x1b[0m');
    expect(first).toContain('/');
  });

  it('shifts colors across frames', () => {
    const frame0 = applyShimmerSweep(lines, 0, { color: true }).join('');
    const frame6 = applyShimmerSweep(lines, 6, { color: true }).join('');
    expect(frame0).not.toEqual(frame6);
  });
});

describe('WELCOME_ART', () => {
  it('has at least 10 lines and fits in a 60-column terminal', () => {
    expect(WELCOME_ART.length).toBeGreaterThanOrEqual(10);
    expect(welcomeArtMinWidth()).toBeLessThanOrEqual(60);
  });
});

describe('playWelcomeBanner', () => {
  it('writes motto instantly in plain mode without sleeping', async () => {
    const chunks: string[] = [];
    let slept = false;

    await playWelcomeBanner({
      forcePlain: true,
      frames: 0,
      write: (text) => {
        chunks.push(text);
      },
      sleep: async () => {
        slept = true;
      },
    });

    const output = chunks.join('');
    expect(output).toContain('V y b e K i i t');
    expect(output).toContain(WELCOME_MOTTO);
    expect(slept).toBe(false);
  });
});
