import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeEnvBlock } from '@vybekiit/browserAutomation/core/writeEnvBlock';
import {
  scrapeCfAccountIdFromUrl,
  scrapeCfTokenFromHtml,
} from '@vybekiit/browserAutomation/domains/infra/dashboard/scrape';
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
});
