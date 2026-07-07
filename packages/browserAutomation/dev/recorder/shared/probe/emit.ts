import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { SelectorEntry } from '@vybekiit/browser-automation/domains/extension/selectors';
import { LS_DRAFT_FIELDS } from '@vybekiit/browser-automation/domains/payments/ls/selectors/fields';
import { type ParsedEntry, renderGenerated } from '../draft';
import type { ClassifiedMatch, ProbeReport } from './types';

function patternText(value: RegExp | string): string {
  return typeof value === 'string' ? value : value.source;
}

function selectorEntryToParsed(entry: SelectorEntry): ParsedEntry {
  switch (entry.kind) {
    case 'css':
      return { kind: 'css', selector: entry.selector };
    case 'label':
      return { kind: 'label', text: patternText(entry.text) };
    case 'placeholder':
      return { kind: 'placeholder', text: patternText(entry.text) };
    case 'role':
      return { kind: 'role', role: entry.role, name: patternText(entry.name) };
  }
}

async function loadExistingRegistryEntries(
  generatedPath: string,
): Promise<Record<string, ParsedEntry>> {
  try {
    const mod = await import(pathToFileURL(generatedPath).href);
    const recorded = mod.LS_RECORDED_SELECTORS as Record<string, SelectorEntry[]> | undefined;
    if (!recorded) return {};
    const out: Record<string, ParsedEntry> = {};
    for (const [key, entries] of Object.entries(recorded)) {
      const fresh = entries.find((e) => e.verifiedAt);
      if (fresh) out[key] = selectorEntryToParsed(fresh);
    }
    return out;
  } catch {
    return {};
  }
}

export async function emitProbeResults(options: {
  generatedPath: string;
  logDir: string;
  matched: Record<string, ClassifiedMatch>;
  report: ProbeReport;
  verifiedKeys: string[];
}): Promise<{ generatedPath: string; logPath: string; writtenCount: number }> {
  const { matched, verifiedKeys, report } = options;
  const newEntries: Record<string, ParsedEntry> = {};

  for (const key of verifiedKeys) {
    const match = matched[key];
    if (match) newEntries[key] = match.entry;
  }

  await mkdir(options.logDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = resolve(options.logDir, `ls-probe-${stamp}.json`);
  await writeFile(logPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  if (Object.keys(newEntries).length === 0) {
    console.log('No verified entries — registry not updated.');
    return { generatedPath: options.generatedPath, logPath, writtenCount: 0 };
  }

  const existing = await loadExistingRegistryEntries(options.generatedPath);
  const merged = { ...existing, ...newEntries };
  const mergedCount = Object.keys(newEntries).length;
  const preservedCount = Object.keys(existing).filter((k) => !(k in newEntries)).length;

  const body = renderGenerated(merged, {
    banner: `LS recorded selectors — merged probe (${mergedCount} updated, ${preservedCount} preserved).`,
    importLine: "import type { SelectorEntry } from '../../../extension/selectors';",
    exportName: 'LS_RECORDED_SELECTORS',
  });

  await mkdir(dirname(options.generatedPath), { recursive: true });
  await writeFile(options.generatedPath, body, 'utf8');

  return {
    generatedPath: options.generatedPath,
    logPath,
    writtenCount: Object.keys(merged).length,
  };
}

export function printProbeSummary(report: ProbeReport, writtenCount: number): void {
  const total = LS_DRAFT_FIELDS.length;
  console.log('');
  console.log(`LS probe complete: ${writtenCount}/${total} verified selectors written.`);
  console.log(
    `  Pages crawled: ${report.crawl.visitedCount}${report.crawl.truncated ? ' (truncated)' : ''}`,
  );
  if (report.verified.length > 0) console.log(`  Verified: ${report.verified.join(', ')}`);
  if (report.verifyFailed.length > 0)
    console.log(`  Verify failed: ${report.verifyFailed.join(', ')}`);
  if (report.missing.length > 0) console.log(`  Missing: ${report.missing.join(', ')}`);
  console.log('');
}
