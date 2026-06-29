import { describe, expect, it } from 'vitest';
import { buildAssistantDeepLink, inferVybeAssistant, resolveVybeAssistant } from '../src/deeplink';
import { formatReportPrompt } from '../src/format-prompt';
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
    expect(prompt).toContain('Route: /dashboard');
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
    expect(url).toMatch(/^cursor:\/\/anysphere\.cursor-deeplink\/prompt\?text=/);
    expect(decodeURIComponent(url.split('text=')[1] ?? '')).toBe('hello world');
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
