import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { recordChromeWebStoreId } from '../cwsIdRegistry';

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

    await expect(readCwsJson()).resolves.toBe(registryJson({ 'new-extension': NEW_EXTENSION_ID }));
  });

  it('records a missing extension without removing existing IDs', async () => {
    await writeCwsJson({
      'existing-extension': EXISTING_EXTENSION_ID,
    });

    await recordChromeWebStoreId(repoRoot, 'new-extension', NEW_EXTENSION_ID);

    await expect(readCwsJson()).resolves.toBe(
      registryJson({
        'existing-extension': EXISTING_EXTENSION_ID,
        'new-extension': NEW_EXTENSION_ID,
      }),
    );
  });

  it('fills an existing empty slot', async () => {
    await writeCwsJson({
      'new-extension': '',
    });

    await recordChromeWebStoreId(repoRoot, 'new-extension', NEW_EXTENSION_ID);

    await expect(readCwsJson()).resolves.toBe(registryJson({ 'new-extension': NEW_EXTENSION_ID }));
  });

  it('refuses to overwrite an existing ID', async () => {
    await writeCwsJson({
      'new-extension': EXISTING_EXTENSION_ID,
    });

    await expect(
      recordChromeWebStoreId(repoRoot, 'new-extension', NEW_EXTENSION_ID),
    ).rejects.toThrow(/already has chromeWebStoreId/);
  });

  it('refuses malformed registry JSON', async () => {
    await mkdir(dirname(cwsJsonPath()), { recursive: true });
    await writeFile(cwsJsonPath(), '{ invalid', 'utf8');

    await expect(
      recordChromeWebStoreId(repoRoot, 'new-extension', NEW_EXTENSION_ID),
    ).rejects.toThrow(/Could not parse/);
  });
});

/** Return the temp registry path used by the current test. */
function cwsJsonPath(): string {
  return join(repoRoot, 'config', 'cws.json');
}

/** Read the temp registry as raw JSON text for formatting-sensitive asserts. */
async function readCwsJson(): Promise<string> {
  return readFile(cwsJsonPath(), 'utf8');
}

/** Serialize registry content with the same formatting the writer emits. */
function registryJson(entries: Record<string, string>): string {
  return `${JSON.stringify(entries, null, 2)}\n`;
}

/** Write the temp registry with canonical formatting. */
async function writeCwsJson(entries: Record<string, string>): Promise<void> {
  await mkdir(dirname(cwsJsonPath()), { recursive: true });
  await writeFile(cwsJsonPath(), registryJson(entries), 'utf8');
}
