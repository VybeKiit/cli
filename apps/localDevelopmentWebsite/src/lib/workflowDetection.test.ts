import { describe, expect, it } from 'vitest';
import { detectWorkflow } from './workflowDetection';

describe('detectWorkflow vibe scenarios', () => {
  it('seeds neon database ready-check wording with neon brand', () => {
    const workflow = detectWorkflow('create neon database with ready feature checks');
    expect(workflow).not.toBeNull();
    const db = workflow?.steps.find((s) => s.id === 'database');
    expect(db?.provider).toBe('neon');
    expect(db?.domain).toBe('database');
  });

  it('seeds supabase database brand', () => {
    const workflow = detectWorkflow('wire supabase database');
    const db = workflow?.steps.find((s) => s.id === 'database');
    expect(db?.provider).toBe('supabase');
  });

  it('seeds multi-domain neon + stripe + cloudflare brands', () => {
    const workflow = detectWorkflow(
      'wire neon database, stripe payments, and deploy to cloudflare',
    );
    expect(workflow?.steps.find((s) => s.id === 'database')?.provider).toBe('neon');
    expect(workflow?.steps.find((s) => s.id === 'payment')?.provider).toBe('stripe');
    expect(workflow?.steps.find((s) => s.id === 'deploy')?.provider).toBe('cloudflare');
  });

  it('defaults payments to lemon squeezy and orders commerce brand', () => {
    const payments = detectWorkflow('take money with checkout');
    expect(payments?.steps.find((s) => s.id === 'payment')?.provider).toBe('lemon squeezy');
  });

  it('seeds full SaaS ship path', () => {
    const workflow = detectWorkflow('ship my SaaS with auth payments and deploy');
    expect(workflow?.title).toBe('Ship your SaaS');
    const ids = new Set(workflow?.steps.map((s) => s.id));
    expect(ids.has('auth')).toBe(true);
    expect(ids.has('database')).toBe(true);
    expect(ids.has('payment')).toBe(true);
    expect(ids.has('deploy')).toBe(true);
  });

  it('seeds render and railway deploy hosts', () => {
    expect(detectWorkflow('deploy to render')?.steps.find((s) => s.id === 'deploy')?.provider).toBe(
      'render',
    );
    expect(
      detectWorkflow('deploy to railway')?.steps.find((s) => s.id === 'deploy')?.provider,
    ).toBe('railway');
  });

  it('returns null for empty chatter', () => {
    expect(detectWorkflow('hello there')).toBeNull();
  });
});
