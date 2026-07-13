import { describe, expect, it } from 'vitest';
import { seedJourneysFromMessage } from './detectIntent';
import { fixtureBridgeEvents, fixtureToolEvents } from './fixtureStream';
import { applyToolEvents } from './matchToolEvents';
import { looksLikeSecret, scrubSecrets } from './secretScrub';
import { seedJourney } from './seedJourney';

describe('seedJourneysFromMessage', () => {
  it('seeds auth with google provider from plain words', () => {
    const journeys = seedJourneysFromMessage('please add google sign-in for my app');
    expect(journeys).toHaveLength(1);
    expect(journeys[0]?.domain).toBe('auth');
    expect(journeys[0]?.params.provider).toBe('google');
    expect(journeys[0]?.skillIntent).toBe('sign-in-with-google');
    expect(journeys[0]?.steps.length).toBeGreaterThan(1);
  });

  it('seeds multiple domains from one message', () => {
    const journeys = seedJourneysFromMessage(
      'wire neon database, stripe payments, and deploy to cloudflare',
    );
    const domains = journeys.map((j) => j.domain);
    expect(domains).toContain('database');
    expect(domains).toContain('payments');
    expect(domains).toContain('deploy');
    expect(journeys.find((j) => j.domain === 'database')?.params.provider).toBe('neon');
    expect(journeys.find((j) => j.domain === 'payments')?.params.provider).toBe('stripe');
    expect(journeys.find((j) => j.domain === 'deploy')?.params.provider).toBe('cloudflare');
  });

  it('seeds deploy index.html + railway / render / supabase presets', () => {
    const cf = seedJourneysFromMessage('deploy index.html to cloudflare pages');
    expect(cf.some((j) => j.domain === 'deploy')).toBe(true);
    const deploy = cf.find((j) => j.domain === 'deploy');
    expect(deploy?.params.provider).toBe('cloudflare');
    expect(deploy?.params.artifact).toBe('index.html');
    expect(deploy?.steps.some((s) => s.id === 'deploy-artifact')).toBe(true);

    const rail = seedJourneysFromMessage('deploy to railway');
    expect(rail.find((j) => j.domain === 'deploy')?.params.provider).toBe('railway');

    const render = seedJourneysFromMessage('deploy to render');
    expect(render.find((j) => j.domain === 'deploy')?.params.provider).toBe('render');

    const sb = seedJourneysFromMessage('wire supabase database ready check');
    const db = sb.find((j) => j.domain === 'database');
    expect(db?.params.provider).toBe('supabase');
    expect(db?.steps.some((s) => s.id === 'db-ready-check')).toBe(true);
  });

  it('seeds crud with resource name and Lemon Squeezy brand for orders', () => {
    const journeys = seedJourneysFromMessage('add crud for orders');
    expect(journeys).toHaveLength(1);
    expect(journeys[0]?.domain).toBe('crud');
    expect(journeys[0]?.params.resource).toBe('orders');
    expect(journeys[0]?.params.provider).toBe('lemon squeezy');
    expect(journeys[0]?.skillIntent).toBe('add-crud');
    expect(journeys[0]?.steps.map((s) => s.id)).toContain('crud-create');
  });

  it('defaults payments / database / deploy brands when not named', () => {
    const pay = seedJourneysFromMessage('take money with checkout');
    expect(pay.find((j) => j.domain === 'payments')?.params.provider).toBe('lemon squeezy');
    const db = seedJourneysFromMessage('save data so the app remembers');
    expect(db.find((j) => j.domain === 'database')?.params.provider).toBe('neon');
  });
});

describe('fixture + applyToolEvents', () => {
  it('completes every step via fixture tool events', () => {
    const journey = seedJourney('payments', { provider: 'stripe' });
    const done = applyToolEvents(journey, fixtureToolEvents(journey));
    expect(done.steps.every((s) => s.status === 'done')).toBe(true);
  });

  it('fixture bridge events never look like secrets', () => {
    const journey = seedJourney('auth', { provider: 'google' });
    for (const event of fixtureBridgeEvents(journey)) {
      if (event.type === 'token' || event.type === 'tool_call') {
        const text = event.type === 'token' ? event.text : `${event.name} ${event.detail ?? ''}`;
        expect(looksLikeSecret(text)).toBe(false);
      }
    }
  });
});

describe('scrubSecrets', () => {
  it('redacts stripe-like keys and database urls', () => {
    const raw =
      'store sk_live_abcdefghijklmnop and postgres://user:hunter2@host/db api_key=supersecrettokenvalue';
    const clean = scrubSecrets(raw);
    expect(clean).not.toContain('sk_live_');
    expect(clean).not.toContain('postgres://');
    expect(clean).toContain('[redacted]');
    expect(looksLikeSecret(clean)).toBe(false);
  });
});
