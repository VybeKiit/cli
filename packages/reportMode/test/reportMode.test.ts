// biome-ignore-all lint/style/noExcessiveLinesPerFile: package regression matrix is intentionally grouped.

import { describe, expect, it } from 'vitest';
import { buildAssistantDeepLink, inferVybeAssistant, resolveVybeAssistant } from '../src/deeplink';
import { formatReportPrompt } from '../src/formatPrompt';
import { loadReportHandoffTarget, saveReportHandoffTarget } from '../src/handoffTarget';
import {
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  hexToRgba,
  INSPECT_HIGHLIGHT_PRESETS,
  loadInspectHighlightColor,
  saveInspectHighlightColor,
} from '../src/inspectHighlightColor';
import {
  computeFlyoutPlacement,
  type FlyoutRect,
  getDockInsetStyle,
  loadDockCornerOnly,
  snapDockToNearestCorner,
} from '../src/position';
import { ConsoleErrorBuffer, REPORT_PROMPT_PREFIX } from '../src/types';

// cursor://anysphere.cursor-deeplink/prompt?text=hello -> match
const cursorDeepLinkPattern = /^cursor:\/\/anysphere\.cursor-deeplink\/prompt\?/;

const noopStorageWrite = (): void => undefined;
const emptyStorageKey = (): string | null => null;

describe('formatReportPrompt', () => {
  it('includes the VybeKiit Report prefix and builder note', () => {
    const prompt = formatReportPrompt({
      route: '/dashboard',
      selector: 'button.submit',
      builderNote: 'button does nothing',
      consoleErrors: [],
    });
    expect(prompt.startsWith(REPORT_PROMPT_PREFIX)).toBe(true);
    expect(prompt).toContain('Builder note: button does nothing');
    expect(prompt).toContain('Page: /dashboard');
  });

  it('includes spot label when present', () => {
    const prompt = formatReportPrompt({
      route: '/',
      selector: 'p.tagline',
      spotLabel: 'Join founders shipping faster with VybeKiit',
      builderNote: 'typewriter too fast',
      consoleErrors: [],
    });
    expect(prompt).toContain('Spot on page: Join founders shipping faster with VybeKiit');
  });

  it('includes console errors when present', () => {
    const prompt = formatReportPrompt({
      route: '/',
      selector: 'div',
      builderNote: 'broken',
      consoleErrors: ['TypeError: x is not a function'],
    });
    expect(prompt).toContain('Recent console errors:');
    expect(prompt).toContain('TypeError: x is not a function');
  });
});

describe('buildAssistantDeepLink', () => {
  it('builds cursor deeplink with encoded text', () => {
    const url = buildAssistantDeepLink('cursor', '/proj', 'hello world');
    expect(url).toMatch(cursorDeepLinkPattern);
    expect(new URL(url).searchParams.get('text')).toBe('hello world');
  });

  it('builds claude-cli deeplink with cwd and q', () => {
    const url = buildAssistantDeepLink('claude', '/my/project', 'fix it');
    expect(url.startsWith('claude-cli://open?')).toBe(true);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('q')).toBe('fix it');
    expect(parsed.searchParams.get('cwd')).toBe('/my/project');
  });

  it('builds codex deeplink', () => {
    const url = buildAssistantDeepLink('codex', '/proj', 'fix it');
    expect(url.startsWith('codex://new?')).toBe(true);
    expect(new URL(url).searchParams.get('prompt')).toBe('fix it');
  });
});

describe('resolveVybeAssistant', () => {
  it('returns null when unset', () => {
    expect(resolveVybeAssistant({})).toBeNull();
  });

  it('parses valid values', () => {
    expect(resolveVybeAssistant({ VYBE_ASSISTANT: 'cursor' })).toBe('cursor');
    expect(resolveVybeAssistant({ VYBE_ASSISTANT: ' Claude ' })).toBe('claude');
  });

  it('parses prefixed public env vars', () => {
    expect(resolveVybeAssistant({ WXT_PUBLIC_VYBE_ASSISTANT: 'cursor' })).toBe('cursor');
    expect(resolveVybeAssistant({ EXPO_PUBLIC_VYBE_ASSISTANT: 'codex' })).toBe('codex');
  });

  it('rejects invalid values', () => {
    expect(resolveVybeAssistant({ VYBE_ASSISTANT: 'copilot' })).toBeNull();
  });
});

describe('inferVybeAssistant', () => {
  it('prefers cursor session', () => {
    expect(
      inferVybeAssistant({ cursorSession: true, claudeInstalled: true, codexInstalled: true }),
    ).toBe('cursor');
  });

  it('falls back to claude then codex', () => {
    expect(
      inferVybeAssistant({ cursorSession: false, claudeInstalled: true, codexInstalled: true }),
    ).toBe('claude');
    expect(
      inferVybeAssistant({ cursorSession: false, claudeInstalled: false, codexInstalled: true }),
    ).toBe('codex');
  });
});

describe('ConsoleErrorBuffer', () => {
  it('keeps only the last N errors', () => {
    const buf = new ConsoleErrorBuffer(3);
    buf.push('a');
    buf.push('b');
    buf.push('c');
    buf.push('d');
    expect(buf.snapshot()).toEqual(['b', 'c', 'd']);
  });
});

describe('snapDockToNearestCorner', () => {
  it('snaps near bottom-right corner', () => {
    expect(
      snapDockToNearestCorner({
        x: 950,
        y: 650,
        viewportWidth: 1000,
        viewportHeight: 700,
        thresholdPx: 80,
      }),
    ).toEqual({ anchor: 'bottom-right' });
  });

  it('keeps custom position when far from corners', () => {
    expect(
      snapDockToNearestCorner({
        x: 400,
        y: 300,
        viewportWidth: 1000,
        viewportHeight: 700,
        thresholdPx: 80,
      }),
    ).toEqual({
      anchor: 'custom',
      customX: 400,
      customY: 300,
    });
  });
});

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: grouped geometry cases document one pure function.
describe('computeFlyoutPlacement', () => {
  const viewport = { width: 1000, height: 800 };
  const flyout = { width: 160, height: 120 };
  // A trigger with room above and to both sides.
  const midTrigger: FlyoutRect = {
    left: 480,
    right: 520,
    top: 400,
    bottom: 428,
    width: 40,
    height: 28,
  };

  it('places the flyout above the trigger, centered, when there is room', () => {
    const { left, top } = computeFlyoutPlacement({ trigger: midTrigger, flyout, viewport });
    // centered: 500 - 80 = 420; above: 400 - 8 - 120 = 272
    expect(left).toBe(420);
    expect(top).toBe(272);
  });

  it('flips below the trigger when near the top edge', () => {
    const topTrigger: FlyoutRect = {
      left: 480,
      right: 520,
      top: 10,
      bottom: 38,
      width: 40,
      height: 28,
    };
    const { top } = computeFlyoutPlacement({ trigger: topTrigger, flyout, viewport });
    // no room above (10 - 8 < 120 + margin) → below: bottom + gap = 38 + 8 = 46
    expect(top).toBe(46);
  });

  it('clamps to the left margin when the trigger hugs the left edge', () => {
    const leftTrigger: FlyoutRect = {
      left: 0,
      right: 40,
      top: 400,
      bottom: 428,
      width: 40,
      height: 28,
    };
    const { left } = computeFlyoutPlacement({ trigger: leftTrigger, flyout, viewport });
    // raw centered = 20 - 80 = -60 → clamped to margin 8
    expect(left).toBe(8);
  });

  it('clamps to the right margin when the trigger hugs the right edge', () => {
    const rightTrigger: FlyoutRect = {
      left: 960,
      right: 1000,
      top: 400,
      bottom: 428,
      width: 40,
      height: 28,
    };
    const { left } = computeFlyoutPlacement({ trigger: rightTrigger, flyout, viewport });
    // max left = 1000 - 160 - 8 = 832
    expect(left).toBe(832);
  });

  it('honors end alignment (right edge of flyout meets right edge of trigger)', () => {
    const { left } = computeFlyoutPlacement({
      trigger: midTrigger,
      flyout,
      viewport,
      align: 'end',
    });
    // end: right - width = 520 - 160 = 360
    expect(left).toBe(360);
  });
});

describe('getDockInsetStyle', () => {
  it('returns bottom-right insets by default margin', () => {
    expect(getDockInsetStyle('bottom-right')).toEqual({ bottom: 16, right: 16 });
  });

  it('returns top-left with custom margin', () => {
    expect(getDockInsetStyle('top-left', 24)).toEqual({ top: 24, left: 24 });
  });
});

describe('inspect color storage', () => {
  it('defaults to amber', () => {
    expect(loadInspectHighlightColor(null)).toBe(DEFAULT_INSPECT_HIGHLIGHT_COLOR);
  });

  it('persists valid hex colors', () => {
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string) => {
        const value = entries.get(key);
        if (value !== undefined) {
          return value;
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
      removeItem: noopStorageWrite,
      clear: noopStorageWrite,
      key: emptyStorageKey,
      length: 0,
    } as Storage;
    saveInspectHighlightColor(storage, '#3B82F6');
    expect(loadInspectHighlightColor(storage)).toBe('#3b82f6');
  });

  it('ignores invalid stored values', () => {
    const storage = {
      getItem: () => 'not-a-color',
      setItem: noopStorageWrite,
      removeItem: noopStorageWrite,
      clear: noopStorageWrite,
      key: emptyStorageKey,
      length: 0,
    } as Storage;
    expect(loadInspectHighlightColor(storage)).toBe(DEFAULT_INSPECT_HIGHLIGHT_COLOR);
  });

  it('includes the default in presets', () => {
    expect(INSPECT_HIGHLIGHT_PRESETS).toContain(DEFAULT_INSPECT_HIGHLIGHT_COLOR);
  });
});

describe('hexToRgba', () => {
  it('converts hex to rgba with alpha', () => {
    expect(hexToRgba('#f59e0b', 0.2)).toBe('rgba(245, 158, 11, 0.2)');
  });

  it('falls back to default for invalid hex', () => {
    expect(hexToRgba('invalid', 0.2)).toBe('rgba(245, 158, 11, 0.2)');
  });
});

describe('loadReportHandoffTarget', () => {
  it('defaults to current chat', () => {
    expect(loadReportHandoffTarget(null)).toBe('current-chat');
  });

  it('persists valid targets', () => {
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string) => {
        const value = entries.get(key);
        if (value !== undefined) {
          return value;
        }
        return null;
      },
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
      removeItem: noopStorageWrite,
      clear: noopStorageWrite,
      key: emptyStorageKey,
      length: 0,
    } as Storage;
    saveReportHandoffTarget(storage, 'new-chat');
    expect(loadReportHandoffTarget(storage)).toBe('new-chat');
  });

  it('ignores invalid stored values', () => {
    const storage = {
      getItem: () => 'invalid',
      setItem: noopStorageWrite,
      removeItem: noopStorageWrite,
      clear: noopStorageWrite,
      key: emptyStorageKey,
      length: 0,
    } as Storage;
    expect(loadReportHandoffTarget(storage)).toBe('current-chat');
  });
});

describe('loadDockCornerOnly', () => {
  it('returns corner anchor from storage', () => {
    const storage = {
      getItem: () => JSON.stringify({ anchor: 'top-right' }),
      setItem: noopStorageWrite,
      removeItem: noopStorageWrite,
      clear: noopStorageWrite,
      key: emptyStorageKey,
      length: 0,
    } as Storage;
    expect(loadDockCornerOnly(storage)).toBe('top-right');
  });

  it('ignores custom anchor and falls back to default corner', () => {
    const storage = {
      getItem: () => JSON.stringify({ anchor: 'custom', customX: 100, customY: 200 }),
      setItem: noopStorageWrite,
      removeItem: noopStorageWrite,
      clear: noopStorageWrite,
      key: emptyStorageKey,
      length: 0,
    } as Storage;
    expect(loadDockCornerOnly(storage)).toBe('bottom-right');
  });
});

describe('devTools', () => {
  it('gates report mode to local dev with opt-in flag', async () => {
    const { shouldShowReportMode } = await import('../src/devTools');
    expect(shouldShowReportMode({ NODE_ENV: 'development', VYBE_REPORT_MODE: '1' })).toBe(true);
    expect(shouldShowReportMode({ NODE_ENV: 'production', VYBE_REPORT_MODE: '1' })).toBe(false);
    expect(shouldShowReportMode({ NODE_ENV: 'development' })).toBe(false);
  });
});
