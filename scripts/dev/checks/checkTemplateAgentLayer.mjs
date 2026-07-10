#!/usr/bin/env node
/**
 * CI gate: fetch official agent-runtime docs, then check-goals + check-agent-layer
 * for all buyer templates.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';
import { repoRootFrom } from '../../lib/repoRoot.mjs';

const repoRoot = repoRootFrom(import.meta.url);
const cli = join(repoRoot, 'cli/dist/bin.js');
const docsScript = join(repoRoot, 'scripts/dev/checks/checkAgentRuntimeDocs.mjs');

const fetchDocs = spawnSync('node', [docsScript], { encoding: 'utf8' });
if (fetchDocs.status !== 0) {
  console.error('Failed to fetch official agent-runtime docs');
  console.error(fetchDocs.stderr);
  process.exit(1);
}
console.log('agent-runtime docs: live fetch ok');

const liveDocs = fetchDocs.stdout.trim();
const templates = ['web', 'mobile', 'extension', 'backend'];
let failed = false;

const discoveryScript = join(repoRoot, 'scripts/dev/checks/validateAgentSkillDiscovery.mjs');
const discovery = spawnSync('node', [discoveryScript], { encoding: 'utf8' });
if (discovery.status === 0) {
  console.log(discovery.stdout.trim());
} else {
  failed = true;
  console.error('agent-skill discovery smoke test failed');
  console.error(discovery.stdout);
  console.error(discovery.stderr);
}

for (const template of templates) {
  const cwd = join(repoRoot, 'templates', template);
  for (const cmd of ['check-goals', 'check-agent-layer']) {
    const result = spawnSync('node', [cli, cmd, template], {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        VYBEKIIT_AGENT_RUNTIME_DOCS: liveDocs,
      },
    });
    if (result.status === 0) {
      console.log(`${template}: ${cmd} ok`);
    } else {
      failed = true;
      console.error(`\n${template}: vybekiit ${cmd} failed\n${result.stdout}\n${result.stderr}`);
    }
  }
}

process.exit(failed ? 1 : 0);
