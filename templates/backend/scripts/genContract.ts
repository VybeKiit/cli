import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOpenApiDocument } from '../src/contract.js';

// Emit the OpenAPI 3.1 document from the backend's route registry (ADR-0043).
// Run with `pnpm gen:contract`; commit the resulting openapi.json.
const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = await readFile(join(backendRoot, 'package.json'), 'utf8');
const pkg = JSON.parse(raw) as { readonly name?: string; readonly version?: string };

const doc = buildOpenApiDocument({
  title: pkg.name ?? 'vybekiit-backend',
  version: pkg.version ?? '0.0.0',
});

const outPath = join(backendRoot, 'openapi.json');
await writeFile(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
