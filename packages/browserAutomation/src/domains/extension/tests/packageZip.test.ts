import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findFreshestZip } from '@vybekiit/browser-automation/domains/extension/packageZip';

import type { VerbContext } from '@vybekiit/browser-automation/domains/extension/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let repoRoot: string;

beforeEach(async () => {
  repoRoot = join(tmpdir(), `cws-package-zip-${process.pid}-${Date.now()}`);
  await mkdir(repoRoot, { recursive: true });
});

afterEach(async () => {
  await rm(repoRoot, { force: true, recursive: true });
});

describe('findFreshestZip', () => {
  it('finds WXT zips emitted beside the extensions directory', async () => {
    const outputDir = join(repoRoot, 'extensions', '.output', 'batchbeam-prompt-queue');
    const zipPath = join(outputDir, 'batchbeam-prompt-queue-2.0.29-chrome.zip');
    await mkdir(outputDir, { recursive: true });
    await writeFile(zipPath, 'zip');

    expect(findFreshestZip(createContext())).toBe(zipPath);
  });
});

const createContext = (): VerbContext => ({
  extension: {
    chromeWebStoreId: 'lidnnjbepijjbbphbdhcchgpckpcbgfm',
    dir: 'extensions/batchbeam-prompt-queue',
    key: 'batchbeam-prompt-queue',
    name: 'BatchBeam Prompt Queue',
  },
  repoRoot,
});
