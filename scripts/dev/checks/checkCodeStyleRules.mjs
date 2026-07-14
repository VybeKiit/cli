#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const ruleCatalogPath = resolve(repositoryRoot, 'code-style.rules.json');

const lineNumberAt = (source, offset) => source.slice(0, offset).split('\n').length;

export const validateRuleCatalog = (ruleCatalog) => {
  const violations = [];
  const ruleIds = new Set();

  if (ruleCatalog.version !== 1) {
    violations.push('code-style.rules.json version must be 1');
  }
  if (!Array.isArray(ruleCatalog.exceptions)) {
    violations.push('code-style.rules.json exceptions must be an array');
  }
  if (!Array.isArray(ruleCatalog.rules)) {
    return [...violations, 'code-style.rules.json rules must be an array'];
  }

  for (const rule of ruleCatalog.rules) {
    if (!rule.id || !rule.summary || !rule.scope) {
      violations.push('Every rule must define id, summary, and scope');
      continue;
    }
    if (!Array.isArray(rule.enforcedBy) || rule.enforcedBy.length === 0) {
      violations.push(`${rule.id} must name at least one enforcement channel`);
    }
    if (ruleIds.has(rule.id)) {
      violations.push(`Duplicate rule id: ${rule.id}`);
    }
    ruleIds.add(rule.id);
  }

  return violations;
};

export const checkSource = (source) => {
  const violations = [];
  const nestedTernaryPattern = /\?[^:\n]*\?/g;
  const vagueDeclarationPattern = /\b(?:const|let)\s+(data|result|temp)\b/g;

  for (const match of source.matchAll(nestedTernaryPattern)) {
    violations.push({
      line: lineNumberAt(source, match.index),
      ruleId: 'control-flow.no-nested-ternary',
      message: 'Name the business facts and branch explicitly.',
    });
  }
  for (const match of source.matchAll(vagueDeclarationPattern)) {
    violations.push({
      line: lineNumberAt(source, match.index),
      ruleId: 'naming.no-vague-local',
      message: `Rename ${match[1]} to the domain value it contains.`,
    });
  }

  return violations;
};

const parseFileArguments = (commandArguments) => {
  const filesIndex = commandArguments.indexOf('--files');
  if (filesIndex === -1) {
    return [];
  }
  return commandArguments.slice(filesIndex + 1);
};

const main = async () => {
  const ruleCatalog = JSON.parse(await readFile(ruleCatalogPath, 'utf8'));
  const catalogViolations = validateRuleCatalog(ruleCatalog);
  const sourcePaths = parseFileArguments(process.argv.slice(2));
  const sourceViolations = [];

  for (const sourcePath of sourcePaths) {
    const repositoryPath = relative(repositoryRoot, resolve(repositoryRoot, sourcePath));
    const isException = ruleCatalog.exceptions.some((exceptionPath) =>
      repositoryPath.startsWith(exceptionPath),
    );
    if (isException) {
      continue;
    }
    const source = await readFile(resolve(repositoryRoot, sourcePath), 'utf8');
    for (const violation of checkSource(source)) {
      sourceViolations.push(`${repositoryPath}:${violation.line} ${violation.ruleId} ${violation.message}`);
    }
  }

  const violations = [...catalogViolations, ...sourceViolations];
  if (violations.length > 0) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    `Code-style catalog valid${sourcePaths.length > 0 ? `; checked ${sourcePaths.length} file(s)` : ''}.\n`,
  );
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
