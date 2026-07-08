import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  getAi,
  getAnalytics,
  getCms,
  getCompliance,
  getJobs,
  getKv,
  getNotifications,
  getRealtime,
  getSearch,
  getTenancy,
} from '@/lib/providers';

describe('providers registry', () => {
  it('resolves local adapters when env is unconfigured', async () => {
    const analytics = await Effect.runPromise(getAnalytics());
    expect(analytics.name).toBeTruthy();
    expect(getJobs().name).toBe('local');
    expect(getCms().name).toBe('mdx');
    expect(getCompliance().name).toBeTruthy();
    expect(getNotifications().name).toBeTruthy();
    expect(getSearch().name).toBe('local');
    const ai = await Effect.runPromise(getAi());
    expect(ai.name).toBe('local');
    expect(getRealtime().name).toBe('local');
    expect(getKv().name).toBe('local');
    expect(getTenancy().name).toBeTruthy();
  });
});
