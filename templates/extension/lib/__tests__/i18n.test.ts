import { describe, expect, it } from 'vitest';
import { localeToDirection } from '../i18n';

describe('i18n', () => {
  it('derives RTL direction from locale', () => {
    expect(localeToDirection('en')).toBe('ltr');
    expect(localeToDirection('he')).toBe('rtl');
    expect(localeToDirection('he-IL')).toBe('rtl');
  });

  it('documents expected Chrome message keys in _locales/en/messages.json', async () => {
    const messages = (await import('../../public/_locales/en/messages.json')).default as Record<
      string,
      { message: string }
    >;
    expect(messages['popup.title']?.message).toBe('My VybeKiit Extension');
    expect(messages['popup.openWebApp']?.message).toBe('Open web app');
  });
});
