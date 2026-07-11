import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeEnvBlock } from '@vybekiit/browser-automation/core/writeEnvBlock';
import {
  scrapeCfAccountIdFromUrl,
  scrapeCfTokenFromHtml,
} from '@vybekiit/browser-automation/domains/infra/dashboard/scrape';
import { describe, expect, it } from 'vitest';

describe('cloudflare scrape', () => {
  it('extracts a cfat_ token from the success dialog html', () => {
    const html = `
      <div role="dialog">
        <p>Your API Token</p>
        <code>cfat_wdJS84FXyq6wqWG2AAsZBeF8ccxj5vGtBmMoXhYi46f516d5</code>
      </div>
    `;
    expect(scrapeCfTokenFromHtml(html)).toBe(
      'cfat_wdJS84FXyq6wqWG2AAsZBeF8ccxj5vGtBmMoXhYi46f516d5',
    );
  });

  it('returns null when no token is present', () => {
    expect(scrapeCfTokenFromHtml('<div>no token here</div>')).toBeNull();
  });

  it('extracts the 32-hex account id from a dashboard url', () => {
    const url = 'https://dash.cloudflare.com/1299fbbb5d6866775fef0433b13dfe55/api-tokens';
    expect(scrapeCfAccountIdFromUrl(url)).toBe('1299fbbb5d6866775fef0433b13dfe55');
  });
});

describe('writeEnvBlock', () => {
  it('appends new keys and preserves existing ones', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-env-'));
    await writeFile(join(dir, '.env'), 'EXISTING=keep\n', 'utf8');

    const result = await writeEnvBlock(
      { CLOUDFLARE_ACCOUNT_ID: 'acc123', CLOUDFLARE_API_TOKEN: 'cfat_secret' },
      dir,
    );

    expect(result.keysWritten).toEqual(['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN']);
    expect(result.keysRemoved).toEqual([]);
    const written = await readFile(join(dir, '.env'), 'utf8');
    expect(written).toContain('EXISTING=keep');
    expect(written).toContain('CLOUDFLARE_ACCOUNT_ID=acc123');
    expect(written).toContain('CLOUDFLARE_API_TOKEN=cfat_secret');
  });

  it('replaces an existing key in place rather than duplicating', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-env-'));
    await writeFile(join(dir, '.env'), 'CLOUDFLARE_API_TOKEN=old\nOTHER=x\n', 'utf8');

    await writeEnvBlock({ CLOUDFLARE_API_TOKEN: 'new' }, dir);

    const written = await readFile(join(dir, '.env'), 'utf8');
    expect(written).toContain('CLOUDFLARE_API_TOKEN=new');
    expect(written).not.toContain('CLOUDFLARE_API_TOKEN=old');
    expect(written.match(/CLOUDFLARE_API_TOKEN=/g)).toHaveLength(1);
    expect(written).toContain('OTHER=x');
  });

  it('writes .env.local when fileName is set and can remove stale keys', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-env-'));
    await writeFile(
      join(dir, '.env.local'),
      'CLOUDFLARE_API_TOKEN=stale\nLEMONSQUEEZY_API_KEY=live\n',
      'utf8',
    );

    const result = await writeEnvBlock(
      {
        LEMONSQUEEZY_TEST_MODE: 'true',
        LEMONSQUEEZY_TEST_MODE_API_KEY: 'test-key',
      },
      dir,
      { fileName: '.env.local', removeKeys: ['CLOUDFLARE_API_TOKEN'] },
    );

    expect(result.keysWritten).toEqual([
      'LEMONSQUEEZY_TEST_MODE',
      'LEMONSQUEEZY_TEST_MODE_API_KEY',
    ]);
    expect(result.keysRemoved).toEqual(['CLOUDFLARE_API_TOKEN']);
    const written = await readFile(join(dir, '.env.local'), 'utf8');
    expect(written).toContain('LEMONSQUEEZY_API_KEY=live');
    expect(written).toContain('LEMONSQUEEZY_TEST_MODE=true');
    expect(written).not.toContain('CLOUDFLARE_API_TOKEN');
  });

  it('dedupes duplicate assignment lines for the same key', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'vk-env-'));
    await writeFile(
      join(dir, '.env'),
      'STORE_PRODUCT_ID=old\nFOO=1\nSTORE_PRODUCT_ID=also-old\n',
      'utf8',
    );

    await writeEnvBlock({ STORE_PRODUCT_ID: '1855372' }, dir);

    const written = await readFile(join(dir, '.env'), 'utf8');
    expect(written.match(/STORE_PRODUCT_ID=/g)).toHaveLength(1);
    expect(written).toContain('STORE_PRODUCT_ID=1855372');
    expect(written).toContain('FOO=1');
  });
});
