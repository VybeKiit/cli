import { describe, expect, it } from 'vitest';
import { buildAssistantDeepLink, inferVybeAssistant, resolveVybeAssistant } from '../src/deeplink';
import {
  DEFAULT_INSPECT_HIGHLIGHT_COLOR,
  hexToRgba,
  INSPECT_HIGHLIGHT_PRESETS,
  loadInspectHighlightColor,
  saveInspectHighlightColor,
} from '../src/inspect-highlight-color';
import { loadReportHandoffTarget, saveReportHandoffTarget } from '../src/handoff-target';
import { formatReportPrompt } from '../src/format-prompt';
import { getDockInsetStyle, loadDockCornerOnly, snapDockToNearestCorner } from '../src/position';
import { ConsoleErrorBuffer, REPORT_PROMPT_PREFIX } from '../src/types';

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
    expect(url).toMatch(/^cursor:\/\/anysphere\.cursor-deeplink\/prompt\?/);
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
    expect(snapDockToNearestCorner(950, 650, 1000, 700, 80)).toEqual({ anchor: 'bottom-right' });
  });

  it('keeps custom position when far from corners', () => {
    expect(snapDockToNearestCorner(400, 300, 1000, 700, 80)).toEqual({
      anchor: 'custom',
      customX: 400,
      customY: 300,
    });
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

describe('loadInspectHighlightColor', () => {
  it('defaults to amber', () => {
    expect(loadInspectHighlightColor(null)).toBe(DEFAULT_INSPECT_HIGHLIGHT_COLOR);
  });

  it('persists valid hex colors', () => {
    const entries = new Map<string, string>();
    const storage = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    saveInspectHighlightColor(storage, '#3B82F6');
    expect(loadInspectHighlightColor(storage)).toBe('#3b82f6');
  });

  it('ignores invalid stored values', () => {
    const storage = {
      getItem: () => 'not-a-color',
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
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
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => {
        entries.set(key, value);
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    saveReportHandoffTarget(storage, 'new-chat');
    expect(loadReportHandoffTarget(storage)).toBe('new-chat');
  });

  it('ignores invalid stored values', () => {
    const storage = {
      getItem: () => 'invalid',
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    expect(loadReportHandoffTarget(storage)).toBe('current-chat');
  });
});

describe('loadDockCornerOnly', () => {
  it('returns corner anchor from storage', () => {
    const storage = {
      getItem: () => JSON.stringify({ anchor: 'top-right' }),
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    expect(loadDockCornerOnly(storage)).toBe('top-right');
  });

  it('ignores custom anchor and falls back to default corner', () => {
    const storage = {
      getItem: () => JSON.stringify({ anchor: 'custom', customX: 100, customY: 200 }),
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;
    expect(loadDockCornerOnly(storage)).toBe('bottom-right');
  });
});
