import { isRtlLocale, resolveLocaleOrDefault } from '@vybekiit/i18n';
import { describe, expect, it } from 'vitest';

describe('locale-rules', () => {
  it('resolves trimmed locale or default', () => {
    expect(resolveLocaleOrDefault('  fr  ', 'en')).toBe('fr');
    expect(resolveLocaleOrDefault('', 'en')).toBe('en');
    expect(resolveLocaleOrDefault(undefined, 'en')).toBe('en');
  });

  it('detects rtl base locales', () => {
    expect(isRtlLocale('ar-SA')).toBe(true);
    expect(isRtlLocale('en-US')).toBe(false);
  });
});
