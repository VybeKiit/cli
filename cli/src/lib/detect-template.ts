import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TemplateName } from './scaffold';

/**
 * Infer template from the buyer project layout when no explicit name is passed.
 */
export async function detectTemplateName(cwd: string): Promise<TemplateName | null> {
  try {
    const raw = await readFile(join(cwd, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw) as { dependencies?: Record<string, string>; main?: string };
    if (pkg.dependencies?.express) {
      return 'backend';
    }
    if (pkg.dependencies?.expo || pkg.main?.includes('expo-router')) {
      return 'mobile';
    }
    if (pkg.dependencies?.next) {
      return 'web';
    }
    if (pkg.dependencies?.vite && pkg.dependencies?.['@tanstack/react-router']) {
      return 'spa';
    }
  } catch {
    // no package.json — fall through
  }
  try {
    await access(join(cwd, '.vybekiit/skills/publish-extension.md'));
    return 'extension';
  } catch {
    return 'web';
  }
}
