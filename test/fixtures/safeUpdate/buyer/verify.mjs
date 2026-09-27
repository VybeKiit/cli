import { readFile } from 'node:fs/promises';

const release = await readFile(new URL('./packages/core/src/release.txt', import.meta.url), 'utf8');

if (release.includes('broken')) {
  process.stderr.write('fixture verification failed\n');
  process.exit(1);
}

process.stdout.write('fixture verification passed\n');
