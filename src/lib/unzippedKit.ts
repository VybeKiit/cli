import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { pathExists } from './pathExists';

export const KIT_ZIP_MARKER = 'vybekiit-kit.json';

const KIT_ROOT_ENTRIES = [KIT_ZIP_MARKER, 'packages', 'templates'] as const;

const kitFolderFile = (home: string): string => join(home, '.vybekiit', 'kit-folder.json');

const isUnzippedKit = async (folder: string): Promise<boolean> => {
  const entryProbes = await Promise.all(
    KIT_ROOT_ENTRIES.map((entry) => pathExists(join(folder, entry))),
  );
  return entryProbes.every(Boolean);
};

export const findUnzippedKit = async (startFolder: string): Promise<string | null> => {
  const folder = resolve(startFolder);
  if (await isUnzippedKit(folder)) {
    return folder;
  }
  const parentFolder = dirname(folder);
  return parentFolder === folder ? null : await findUnzippedKit(parentFolder);
};

export const rememberUnzippedKit = async (
  kitRoot: string,
  home: string = homedir(),
): Promise<void> => {
  const savedFile = kitFolderFile(home);
  await mkdir(dirname(savedFile), { recursive: true });
  await writeFile(savedFile, `${JSON.stringify({ kitRoot }, null, 2)}\n`, 'utf8');
};

const rememberedUnzippedKit = async (home: string): Promise<string | null> => {
  try {
    const savedText = await readFile(kitFolderFile(home), 'utf8');
    const { kitRoot } = JSON.parse(savedText) as { readonly kitRoot?: unknown };
    const stillUnzipped = typeof kitRoot === 'string' && (await isUnzippedKit(kitRoot));
    return stillUnzipped ? kitRoot : null;
  } catch {
    return null;
  }
};

export const locateUnzippedKit = async (
  cwd: string = process.cwd(),
  home: string = homedir(),
): Promise<string | null> => {
  const surroundingKit = await findUnzippedKit(cwd);
  if (surroundingKit !== null) {
    return surroundingKit;
  }
  return await rememberedUnzippedKit(home);
};
