import { describe, expect, it } from 'vitest';
import { planInstall, selectToolchain } from '../../src/doctor/toolchain';

describe('selectToolchain defaults', () => {
  it('returns the default provider tools for empty env', () => {
    expect(selectToolchain({}).map((tool) => tool.name)).toEqual(['gh', 'wrangler', 'supabase']);
  });

  it('matches the explicit cloudflare and supabase defaults', () => {
    const names = selectToolchain({
      HOSTING_PROVIDER: 'cloudflare',
      DATA_PROVIDER: 'supabase',
    }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'wrangler', 'supabase']);
  });

  it('always leads with the GitHub base tool', () => {
    expect(selectToolchain({}).map((tool) => tool.name)[0]).toBe('gh');
    expect(
      selectToolchain({ HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'aws' }).map(
        (tool) => tool.name,
      )[0],
    ).toBe('gh');
    expect(selectToolchain({}, { mobile: true }).map((tool) => tool.name)[0]).toBe('gh');
  });

  it('configures the GitHub sign-in probe', () => {
    const gh = selectToolchain({}).find((tool) => tool.name === 'gh');

    expect(gh?.auth?.command).toBe('gh');
    expect(gh?.auth?.args).toEqual(['auth', 'status']);
    expect(gh?.auth?.loginHint).toBe('gh auth login --web');
  });
});

describe('selectToolchain data providers', () => {
  it('includes Atlas for MongoDB', () => {
    const names = selectToolchain({ DATA_PROVIDER: 'mongodb' }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'wrangler', 'atlas']);
  });

  it('omits Supabase CLI for Neon because it is MCP-first', () => {
    const names = selectToolchain({ DATA_PROVIDER: 'neon' }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'wrangler']);
  });

  it('uses Railway for a coupled Railway stack', () => {
    const names = selectToolchain({
      HOSTING_PROVIDER: 'railway',
      DATA_PROVIDER: 'railway',
    }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'railway']);
  });

  it('adds Railway and omits Supabase when Railway owns data', () => {
    const names = selectToolchain({ DATA_PROVIDER: 'railway' }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'wrangler', 'railway']);
    expect(names).not.toContain('supabase');
  });
});

describe('selectToolchain hosting and auxiliary providers', () => {
  it('includes AWS once when any auxiliary AWS adapter is active', () => {
    expect(selectToolchain({ STORAGE_PROVIDER: 's3' }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
      'aws',
    ]);
    expect(selectToolchain({ EMAIL_PROVIDER: 'ses' }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
      'aws',
    ]);
    expect(selectToolchain({ AUTH_PROVIDER: 'cognito' }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
      'aws',
    ]);
  });

  it('uses Vercel CLI for Vercel hosting', () => {
    const names = selectToolchain({ HOSTING_PROVIDER: 'vercel' }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'vercel', 'supabase']);
  });

  it('uses only gh for GitHub Pages hosting (free static, ADR-0040)', () => {
    const names = selectToolchain({ HOSTING_PROVIDER: 'github-pages' }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'supabase']);
  });

  it('dedupes AWS when hosting and data are both AWS', () => {
    const names = selectToolchain({ HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'aws' }).map(
      (tool) => tool.name,
    );

    expect(names).toEqual(['gh', 'aws']);
  });

  it('handles mixed AWS hosting with MongoDB data', () => {
    const names = selectToolchain({ HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'mongodb' }).map(
      (tool) => tool.name,
    );

    expect(names).toEqual(['gh', 'aws', 'atlas']);
  });
});

describe('selectToolchain mobile tools', () => {
  it('appends mobile tools on top of the env tools', () => {
    const names = selectToolchain({}, { mobile: true }).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'eas', 'launch']);
  });

  it('dedupes mobile tools after AWS adapters', () => {
    const names = selectToolchain(
      { HOSTING_PROVIDER: 'aws', DATA_PROVIDER: 'aws' },
      { mobile: true },
    ).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'aws', 'eas', 'launch']);
    expect(names.filter((name) => name === 'eas')).toHaveLength(1);
    expect(names.filter((name) => name === 'launch')).toHaveLength(1);
  });

  it('keeps web defaults when mobile is false or omitted', () => {
    expect(selectToolchain({}, { mobile: false }).map((tool) => tool.name)).toEqual([
      'gh',
      'wrangler',
      'supabase',
    ]);
    expect(selectToolchain({}).map((tool) => tool.name)).toEqual(['gh', 'wrangler', 'supabase']);
  });

  it('configures mobile tool auth probes', () => {
    const launch = selectToolchain({}, { mobile: true }).find((tool) => tool.name === 'launch');
    const eas = selectToolchain({}, { mobile: true }).find((tool) => tool.name === 'eas');

    expect(launch?.auth).toBeUndefined();
    expect(eas?.auth?.command).toBe('eas');
    expect(eas?.auth?.loginHint).toBe('eas login');
  });
});

describe('selectToolchain Google auth tools', () => {
  it('adds gcloud when Google auth is requested', () => {
    const names = selectToolchain({}, { wantsGoogleAuth: true }).map((tool) => tool.name);

    expect(selectToolchain({}).map((tool) => tool.name)).not.toContain('gcloud');
    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'gcloud']);
  });

  it('adds gcloud when Google OAuth env is present', () => {
    const names = selectToolchain({ GOOGLE_OAUTH_CLIENT_ID: 'abc.apps.googleusercontent.com' }).map(
      (tool) => tool.name,
    );

    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'gcloud']);
  });

  it('dedupes gcloud before mobile tools', () => {
    const names = selectToolchain(
      { STORAGE_PROVIDER: 's3', GOOGLE_OAUTH_CLIENT_ID: 'x' },
      { wantsGoogleAuth: true, mobile: true },
    ).map((tool) => tool.name);

    expect(names).toEqual(['gh', 'wrangler', 'supabase', 'aws', 'gcloud', 'eas', 'launch']);
    expect(names.filter((name) => name === 'gcloud')).toHaveLength(1);
  });

  it('configures gcloud auth and install commands', () => {
    const gcloud = selectToolchain({}, { wantsGoogleAuth: true }).find(
      (tool) => tool.name === 'gcloud',
    );
    const presence = [{ tool: 'gcloud', present: false }];

    expect(gcloud?.auth?.command).toBe('gcloud');
    expect(gcloud?.auth?.args).toEqual(['auth', 'list']);
    expect(gcloud?.auth?.loginHint).toBe('gcloud auth login');
    for (const platform of ['darwin', 'win32', 'linux'] as const) {
      const [action] = planInstall(platform, presence, gcloud ? [gcloud] : []);
      expect(action?.command).toBeTruthy();
      expect(action?.args.length).toBeGreaterThan(0);
    }
  });
});
