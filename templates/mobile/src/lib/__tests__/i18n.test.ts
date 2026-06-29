import { describe, expect, it, vi } from 'vitest';
import messages from '../../../messages/en.json' with { type: 'json' };
import { localeToDirection } from '@/lib/direction';

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

vi.mock('react-native', () => ({
  I18nManager: { isRTL: false, allowRTL: vi.fn(), forceRTL: vi.fn() },
}));

describe('i18n', () => {
  it('resolves known keys in the default locale catalog', async () => {
    const { initI18n, t } = await import('@/lib/i18n');
    initI18n();
    expect(t('home.hero.title')).toBe('Your app starts here.');
    expect(messages['auth.login.submit']).toBe('Sign in');
  });

  it('derives RTL direction from locale', () => {
    expect(localeToDirection('en')).toBe('ltr');
    expect(localeToDirection('he')).toBe('rtl');
  });
});
