import { describe, expect, it } from 'vitest';
import { resolveNotificationsProvider } from '../resolve';

describe('resolveNotificationsProvider', () => {
  it('defaults to expo provider', () => {
    const n = resolveNotificationsProvider({ NOTIFICATIONS_PROVIDER: 'expo' });
    expect(n.name).toBe('expo');
  });

  it('local provider succeeds', async () => {
    const n = resolveNotificationsProvider({ NOTIFICATIONS_PROVIDER: 'local' });
    const result = await n.send({
      channel: 'push',
      to: 'ExponentPushToken[xxx]',
      body: 'hello',
    });
    expect(result.ok).toBe(true);
  });
});
