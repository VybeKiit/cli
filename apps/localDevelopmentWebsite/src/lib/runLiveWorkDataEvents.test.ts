import { describe, expect, it } from 'vitest';
import {
  hostVendorFromScenario,
  paymentsVendorFromScenario,
  vendorFromScenario,
} from './runLiveWorkDataEvents';

describe('vendorFromScenario (data)', () => {
  it('maps known brands', () => {
    expect(vendorFromScenario('neon', ['neon'])).toBe('neon');
    expect(vendorFromScenario('x', ['supabase'])).toBe('supabase');
    expect(vendorFromScenario('railway-db', [])).toBe('railway');
  });

  it('returns undefined when no match', () => {
    expect(vendorFromScenario('generic', ['other'])).toBeUndefined();
  });
});

describe('paymentsVendorFromScenario', () => {
  it('maps known brands', () => {
    expect(paymentsVendorFromScenario('stripe', ['stripe'])).toBe('stripe');
    expect(paymentsVendorFromScenario('ls', ['lemon'])).toBe('lemon-squeezy');
    expect(paymentsVendorFromScenario('paypal-checkout', [])).toBe('paypal');
  });

  it('returns undefined when no match', () => {
    expect(paymentsVendorFromScenario('generic', [])).toBeUndefined();
  });
});

describe('hostVendorFromScenario', () => {
  it('maps known brands', () => {
    expect(hostVendorFromScenario('cloudflare', ['cloudflare'])).toBe('cloudflare');
    expect(hostVendorFromScenario('x', ['vercel'])).toBe('vercel');
    expect(hostVendorFromScenario('render-host', [])).toBe('render');
    expect(hostVendorFromScenario('railway-host', [])).toBe('railway');
  });

  it('returns undefined when no match', () => {
    expect(hostVendorFromScenario('generic', [])).toBeUndefined();
  });
});
