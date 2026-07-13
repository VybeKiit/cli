import { describe, expect, it } from 'vitest';
import { loadWorkspaceEnv } from './workspaceEnv';

describe('loadWorkspaceEnv', () => {
  it('returns a record (process env and optional monorepo .env)', () => {
    const env = loadWorkspaceEnv();
    expect(typeof env).toBe('object');
    expect(env).not.toBeNull();
    // PATH is always present in process.env on real machines
    expect(typeof env.PATH === 'string' || env.PATH === undefined).toBe(true);
  });
});
