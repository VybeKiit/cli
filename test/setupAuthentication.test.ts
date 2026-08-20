import { describe, expect, it, vi } from 'vitest';
import { connectSetupServices } from '../src/commands/setupAuthentication';
import type { SetupPreferences } from '../src/commands/setupPreferences';

const SELECTED_STACK: SetupPreferences = {
  data: 'supabase',
  googleSignIn: false,
  hosting: 'cloudflare',
};

describe('connectSetupServices', () => {
  it('reuses existing sign-ins and does not open another browser flow', () => {
    const run = vi.fn(() => 0);
    const result = connectSetupServices(SELECTED_STACK, run);

    expect(result.ok).toBe(true);
    expect(result.connected).toEqual(['gh', 'wrangler', 'supabase']);
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('runs the official browser sign-in and verifies it afterward', () => {
    const attempts = new Map<string, number>();
    const run = vi.fn((command: string, args: readonly string[], interactive: boolean) => {
      const key = `${command} ${args.join(' ')}`;
      const attempt = attempts.get(key) ?? 0;
      attempts.set(key, attempt + 1);

      if (command === 'wrangler' && args[0] === 'whoami') {
        return attempt === 0 ? 1 : 0;
      }
      if (command === 'wrangler' && args[0] === 'login') {
        expect(interactive).toBe(true);
        return 0;
      }
      return 0;
    });

    const result = connectSetupServices(SELECTED_STACK, run);

    expect(result.ok).toBe(true);
    expect(run).toHaveBeenCalledWith('wrangler', ['login'], true);
    expect(run).toHaveBeenCalledWith('wrangler', ['whoami'], false);
  });

  it('fails honestly when sign-in still cannot be verified', () => {
    const run = vi.fn((command: string) => (command === 'supabase' ? 1 : 0));
    const result = connectSetupServices(SELECTED_STACK, run);

    expect(result.ok).toBe(false);
    expect(result.needsAttention).toEqual(['supabase']);
    expect(result.lines.join('\n')).toContain('supabase login');
  });
});
