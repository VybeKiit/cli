import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkPackageExportMap,
  checkSource,
  validateRuleCatalog,
} from './dev/checks/checkCodeStyleRules.mjs';

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('code style rule catalog', () => {
  it('requires unique rule ids and an enforcement channel', () => {
    const violations = validateRuleCatalog({
      version: 1,
      exceptions: [],
      packageExportWildcardExceptions: [],
      rules: [
        {
          id: 'naming.domain-terms',
          summary: 'Use domain terms.',
          scope: 'authored',
          enforcedBy: ['review'],
        },
      ],
    });

    expect(violations).toEqual([]);
  });

  it('rejects duplicate ids and missing enforcement channels', () => {
    const violations = validateRuleCatalog({
      version: 1,
      exceptions: [],
      packageExportWildcardExceptions: [],
      rules: [
        { id: 'naming.domain-terms', summary: 'First.', scope: 'authored', enforcedBy: [] },
        {
          id: 'naming.domain-terms',
          summary: 'Second.',
          scope: 'authored',
          enforcedBy: ['review'],
        },
      ],
    });

    expect(violations).toEqual([
      'naming.domain-terms must name at least one enforcement channel',
      'Duplicate rule id: naming.domain-terms',
    ]);
  });
});

describe('authored source checks', () => {
  it('reports nested ternaries', () => {
    const violations = checkSource('const label = ready ? active ? "on" : "off" : "wait";');

    expect(violations.map((violation) => violation.ruleId)).toContain(
      'control-flow.no-nested-ternary',
    );
  });

  it('reports vague local declarations without flagging object properties', () => {
    const source = [
      'const data = await readBody();',
      'const bodyRequest = { data: "value" };',
      'return bodyRequest;',
    ].join('\n');
    const violations = checkSource(source);

    expect(violations.map((violation) => violation.ruleId)).toEqual(['naming.no-vague-local']);
  });

  it('can check a temporary file through the CLI contract', async () => {
    const temporaryDirectory = await mkdtemp(join(tmpdir(), 'vybekiit-style-'));
    temporaryDirectories.push(temporaryDirectory);
    const sourcePath = join(temporaryDirectory, 'nested.ts');
    await writeFile(sourcePath, 'const value = first ? second ? 1 : 2 : 3;\n');

    const violations = checkSource(
      await import('node:fs/promises').then(({ readFile }) => readFile(sourcePath, 'utf8')),
    );

    expect(violations).toHaveLength(1);
  });
});

describe('package surface checks', () => {
  it('rejects wildcard package entrypoints', () => {
    expect(
      checkPackageExportMap('@vybekiit/example', {
        '.': './src/index.ts',
        './*': './src/*.ts',
      }),
    ).toEqual([
      '@vybekiit/example architecture.no-wildcard-package-exports wildcard entrypoint ./*',
    ]);
  });

  it('accepts deliberate package entrypoints', () => {
    expect(
      checkPackageExportMap('@vybekiit/example', {
        '.': './src/index.ts',
        './client': './src/client.ts',
      }),
    ).toEqual([]);
  });

  it('keeps each legacy wildcard exception explicit', () => {
    expect(
      checkPackageExportMap('@vybekiit/example', { './*': './src/*.ts' }, [
        '@vybekiit/example:./*',
      ]),
    ).toEqual([]);
  });
});
