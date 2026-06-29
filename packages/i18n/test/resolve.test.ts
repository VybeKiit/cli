import { describe, expect, it } from 'vitest';
import { resolveI18nProvider } from '../src/resolve';

describe('resolveI18nProvider', () => {
  it('defaults to local provider', () => {
    const provider = resolveI18nProvider({ DEFAULT_LOCALE: 'en', MESSAGES_DIR: 'messages' });
    expect(provider.name).toBe('local');
    expect(provider.resolveLocale()).toBe('en');
    expect(provider.isRtl('he')).toBe(true);
    expect(provider.isRtl('en')).toBe(false);
  });
});
