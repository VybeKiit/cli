import { readNodeEnv } from '@/lib/nodeEnv';

/**
 * Whether price-ladder simulate/reset endpoints are allowed.
 *
 * Enabled when any of:
 * - `NODE_ENV` is `development` or `test`
 * - `LEMONSQUEEZY_TEST_MODE=true` (store test mode)
 * - `PRICE_LADDER_TEST_MODE=true` (explicit opt-in, e.g. staging e2e)
 *
 * Production live traffic with real payments must leave these off so only the
 * signed payment webhook can move the ladder.
 *
 * @returns `true` when test-mode ladder controls are open.
 * @example
 * if (!isPriceLadderTestMode()) return NextResponse.json({ error: '…' }, { status: 404 });
 */
export const isPriceLadderTestMode = (): boolean => {
  const env = readNodeEnv();
  if (env.PRICE_LADDER_TEST_MODE === 'true') {
    return true;
  }
  if (env.LEMONSQUEEZY_TEST_MODE === 'true') {
    return true;
  }
  const nodeEnv = env.NODE_ENV;
  return nodeEnv === 'development' || nodeEnv === 'test';
};
