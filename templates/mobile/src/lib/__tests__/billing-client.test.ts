import { describe, expect, it } from 'vitest';
import { startCheckout } from '../billing-client';

describe('billing-client stub', () => {
  it('rejects an empty plan id with invalid_input', async () => {
    const result = await startCheckout('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('invalid_input');
  });

  it('returns not_configured until setup-payments runs', async () => {
    const result = await startCheckout('plan_pro');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('not_configured');
  });
});
