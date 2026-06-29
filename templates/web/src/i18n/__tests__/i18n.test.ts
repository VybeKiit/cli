import { describe, expect, it } from 'vitest';
import messages from '../../../messages/en.json' with { type: 'json' };
import { localeToDirection, localeToLang } from '@/lib/direction';

describe('i18n', () => {
  it('resolves known keys in the default locale catalog', () => {
    expect(messages['home.hero.title']).toBe('Your app starts here.');
    expect(messages['auth.login.submit']).toBe('Sign in');
  });

  it('derives RTL direction from locale', () => {
    expect(localeToDirection('en')).toBe('ltr');
    expect(localeToDirection('he')).toBe('rtl');
    expect(localeToDirection('he-IL')).toBe('rtl');
  });

  it('derives lang tag from locale', () => {
    expect(localeToLang('en-US')).toBe('en');
    expect(localeToLang('he')).toBe('he');
  });
});
