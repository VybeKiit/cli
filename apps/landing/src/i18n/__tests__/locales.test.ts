import { describe, expect, it } from 'vitest';
import { isLandingRtl, LANDING_LOCALES, parseLandingLocale } from '@/i18n/locales';
import { LANDING_MESSAGES } from '@/i18n/messages';

describe('landing locales', () => {
  it('parses only the four supported tags', () => {
    expect(parseLandingLocale('en')).toBe('en');
    expect(parseLandingLocale('he')).toBe('he');
    expect(parseLandingLocale('ru')).toBe('ru');
    expect(parseLandingLocale('ar')).toBe('ar');
    expect(parseLandingLocale('fr')).toBeNull();
    expect(parseLandingLocale(undefined)).toBeNull();
  });

  it('marks Hebrew and Arabic as RTL', () => {
    expect(isLandingRtl('he')).toBe(true);
    expect(isLandingRtl('ar')).toBe(true);
    expect(isLandingRtl('en')).toBe(false);
    expect(isLandingRtl('ru')).toBe(false);
  });

  it('ships message catalogs for every picker locale', () => {
    for (const entry of LANDING_LOCALES) {
      const messages = LANDING_MESSAGES[entry.id];
      expect(messages.nav.getVybekiit.length).toBeGreaterThan(0);
      expect(messages.hero.headlineHighlight.length).toBeGreaterThan(0);
      expect(messages.compare.optionColumn.length).toBeGreaterThan(0);
      expect(messages.compare.youBadge.length).toBeGreaterThan(0);
      expect(messages.pageRecipes.headline.includes('{readyCount}')).toBe(true);
      expect(messages.checkout.titlePrefix.length).toBeGreaterThan(0);
      expect(messages.platforms.mockOverview.length).toBeGreaterThan(0);
      expect(messages.faq.items.length).toBe(LANDING_MESSAGES.en.faq.items.length);
      expect(messages.operator.steps.length).toBe(LANDING_MESSAGES.en.operator.steps.length);
      expect(messages.zigZag.race.steps.length).toBe(LANDING_MESSAGES.en.zigZag.race.steps.length);
      expect(messages.zigZag.auth.googleCta.length).toBeGreaterThan(0);
      expect(messages.zigZag.settings.saveCta.length).toBeGreaterThan(0);
    }
  });
});
