import { describe, expect, it } from 'vitest';
import {
  getOpenableScenario,
  OPENABLE_SCENARIOS,
  openableScenarioUrl,
  scenarioBrandTokens,
  scenarioIdFromSearch,
} from './openableScenarios';

describe('openableScenarios', () => {
  it('catalog covers core vibe domains', () => {
    const ids = new Set(OPENABLE_SCENARIOS.map((s) => s.id));
    for (const id of [
      'neon',
      'supabase',
      'auth-google',
      'stripe',
      'lemon',
      'crud-orders',
      'cloudflare',
      'vercel',
      'render',
      'railway',
      'combo',
      'saas',
    ]) {
      expect(ids.has(id), `missing scenario ${id}`).toBe(true);
    }
  });

  it('exposes dynamic brand tokens (LS for orders, multi for combo)', () => {
    expect(scenarioBrandTokens(getOpenableScenario('crud-orders')!)).toEqual(['lemon squeezy']);
    expect(scenarioBrandTokens(getOpenableScenario('combo')!)).toEqual([
      'neon',
      'stripe',
      'cloudflare',
    ]);
    expect(scenarioBrandTokens(getOpenableScenario('neon')!)).toEqual(['neon']);
  });

  it('resolves scenario by id case-insensitively', () => {
    expect(getOpenableScenario('NEON')?.prompt).toMatch(/neon/i);
    expect(getOpenableScenario('missing')).toBeUndefined();
  });

  it('parses scenario from search', () => {
    expect(scenarioIdFromSearch('?fixture=1&scenario=stripe')).toBe('stripe');
    expect(scenarioIdFromSearch('')).toBeNull();
  });

  it('builds openable URL', () => {
    expect(openableScenarioUrl('neon')).toBe('http://localhost:3005/?fixture=1&scenario=neon');
  });
});
