import { readFile, writeFile } from 'node:fs/promises';

export type ParsedEntry =
  | { kind: 'css'; selector: string }
  | { kind: 'label'; text: string }
  | { kind: 'placeholder'; text: string }
  | { kind: 'role'; name: string; role: string };

export function parseExpression(expression: string, lineNumber: number): ParsedEntry {
  const stripped = expression.replace(/^page\./, '');
  const role = stripped.match(
    /^getByRole\(\s*(['"])([^'"]+)\1\s*,\s*\{\s*name\s*:\s*(['"])([^'"]+)\3\s*\}\s*\)$/,
  );
  if (role) return { kind: 'role', name: role[4]!, role: role[2]! };

  const label = stripped.match(/^getByLabel\(\s*(['"])([^'"]+)\1\s*\)$/);
  if (label) return { kind: 'label', text: label[2]! };

  const placeholder = stripped.match(/^getByPlaceholder\(\s*(['"])([^'"]+)\1\s*\)$/);
  if (placeholder) return { kind: 'placeholder', text: placeholder[2]! };

  const css = stripped.match(/^locator\(\s*(['"])([^'"]+)\1\s*\)$/);
  if (css) return { kind: 'css', selector: css[2]! };

  throw new Error(
    `Draft line ${lineNumber}: cannot parse "${expression}". Expected getByRole/getByLabel/getByPlaceholder/locator with a single string arg.`,
  );
}

export function parseDraft(
  raw: string,
  knownFields: readonly string[],
): Record<string, ParsedEntry> {
  const out: Record<string, ParsedEntry> = {};
  const knownKeys = new Set<string>(knownFields);
  for (const [lineNumber, rawLine] of raw.split('\n').entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) throw new Error(`Draft line ${lineNumber + 1}: missing "=" — ${line}`);
    const key = line.slice(0, eq).trim();
    const expression = line.slice(eq + 1).trim();
    if (!expression) continue;
    if (!knownKeys.has(key)) {
      throw new Error(
        `Draft line ${lineNumber + 1}: unknown field key "${key}". Expected one of:\n  ${[...knownKeys].join('\n  ')}`,
      );
    }
    out[key] = parseExpression(expression, lineNumber + 1);
  }
  return out;
}

function renderEntry(entry: ParsedEntry, today: string): string {
  switch (entry.kind) {
    case 'css':
      return `{ kind: 'css', selector: ${JSON.stringify(entry.selector)}, verifiedAt: ${JSON.stringify(today)} }`;
    case 'label':
      return `{ kind: 'label', text: ${JSON.stringify(entry.text)}, verifiedAt: ${JSON.stringify(today)} }`;
    case 'placeholder':
      return `{ kind: 'placeholder', text: ${JSON.stringify(entry.text)}, verifiedAt: ${JSON.stringify(today)} }`;
    case 'role':
      return `{ kind: 'role', role: ${JSON.stringify(entry.role)}, name: ${JSON.stringify(entry.name)}, verifiedAt: ${JSON.stringify(today)} }`;
  }
}

export function renderGenerated(
  entries: Record<string, ParsedEntry>,
  options: { banner: string; importLine: string; exportName: string },
): string {
  const today = new Date().toISOString().slice(0, 10);
  const body = Object.entries(entries)
    .map(([key, entry]) => `  ${JSON.stringify(key)}: [${renderEntry(entry, today)}],`)
    .join('\n');
  return `/**
 * ${options.banner}
 *
 * Last regenerated: ${today}
 */

${options.importLine}

export const ${options.exportName}: Record<string, SelectorEntry[]> = {
${body}
};
`;
}

export async function ensureDraftTemplate(
  draftPath: string,
  fields: readonly string[],
  headerLines: string[],
): Promise<void> {
  try {
    await readFile(draftPath, 'utf8');
    return;
  } catch {
    /* missing — write template */
  }
  const lines = [...headerLines, '', ...fields.map((key) => `${key} = `), ''];
  await writeFile(draftPath, lines.join('\n'), 'utf8');
  console.log(`Wrote draft template at ${draftPath}`);
}

export async function applyDraft(options: {
  draftPath: string;
  generatedPath: string;
  knownFields: readonly string[];
  render: (entries: Record<string, ParsedEntry>) => string;
}): Promise<void> {
  const raw = await readFile(options.draftPath, 'utf8').catch(() => {
    throw new Error(`Draft file not found at ${options.draftPath}. Run open-recorder first.`);
  });
  const recorded = parseDraft(raw, options.knownFields);
  if (Object.keys(recorded).length === 0) {
    console.log('No populated entries in draft — nothing to write.');
    return;
  }
  await writeFile(options.generatedPath, options.render(recorded), 'utf8');
  console.log(`OK: wrote ${Object.keys(recorded).length} entr(ies) to ${options.generatedPath}`);
}
