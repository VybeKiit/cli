import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { recordChromeWebStoreId } from '@vybekiit/browserAutomation/domains/extension/cwsIdRegistry';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const NEW_EXTENSION_ID = 'abcdefghijklmnopabcdefghijklmnop';
const EXISTING_EXTENSION_ID = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

let repoRoot: string;

beforeEach(async () => {
  repoRoot = await mkdtemp(join(tmpdir(), 'cws-id-registry-'));
});

afterEach(async () => {
  await rm(repoRoot, { force: true, recursive: true });
});

describe('recordChromeWebStoreId', () => {
  it('creates cws.json when the registry is missing', async () => {
    await recordChromeWebStoreId(repoRoot, 'new-extension', NEW_EXTENSION_ID);

    const parsed = JSON.parse(await readCwsJson());
    expect(parsed.chromeWebStoreId).toBe(NEW_EXTENSION_ID);
    expect(parsed.key).toBe('new-extension');
  });

  it('records when chromeWebStoreId is empty', async () => {
    await writeCwsJson({ chromeWebStoreId: '', key: 'extension', name: 'Extension' });

    await recordChromeWebStoreId(repoRoot, 'extension', NEW_EXTENSION_ID);

    const parsed = JSON.parse(await readCwsJson());
    expect(parsed.chromeWebStoreId).toBe(NEW_EXTENSION_ID);
  });

  it('refuses to overwrite an existing ID', async () => {
    await writeCwsJson({
      chromeWebStoreId: EXISTING_EXTENSION_ID,
      key: 'extension',
      name: 'Extension',
    });

    await expect(recordChromeWebStoreId(repoRoot, 'extension', NEW_EXTENSION_ID)).rejects.toThrow(
      /already has chromeWebStoreId/,
    );
  });

  it('refuses malformed registry JSON', async () => {
    await mkdir(dirname(cwsJsonPath()), { recursive: true });
    await writeFile(cwsJsonPath(), '{ invalid', 'utf8');

    await expect(recordChromeWebStoreId(repoRoot, 'extension', NEW_EXTENSION_ID)).rejects.toThrow(
      /Could not parse/,
    );
  });
});

function cwsJsonPath(): string {
  return join(repoRoot, '.vybekiit', 'store', 'extension', 'cws.json');
}

async function readCwsJson(): Promise<string> {
  return readFile(cwsJsonPath(), 'utf8');
}

async function writeCwsJson(config: {
  chromeWebStoreId: string;
  key: string;
  name: string;
}): Promise<void> {
  await mkdir(dirname(cwsJsonPath()), { recursive: true });
  await writeFile(cwsJsonPath(), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}
