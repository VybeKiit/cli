/** Row in goal-index pointing at an extension skill. */
const EXTENSION_SKILL_PATH_RE = /extensions\/skills\/[a-z0-9-]+\.md/;

/**
 * Extract goal-index table rows that reference extension skills (buyer-owned).
 * Preserved across sync-agent-layer overwrites.
 */
export function extractExtensionGoalIndexRows(goalIndexContent: string): string[] {
  const rows: string[] = [];
  for (const line of goalIndexContent.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (EXTENSION_SKILL_PATH_RE.test(line)) {
      rows.push(line);
    }
  }
  return rows;
}

/**
 * Merge extension goal-index rows from buyer copy into freshly synced maintainer copy.
 * Appends missing extension rows before the closing section (or at end of table).
 */
export function mergeGoalIndexOnSync(
  syncedContent: string,
  buyerContent: string | undefined,
): string {
  if (buyerContent === undefined) {
    return syncedContent;
  }
  const extensionRows = extractExtensionGoalIndexRows(buyerContent);
  if (extensionRows.length === 0) {
    return syncedContent;
  }

  const existing = new Set(extractExtensionGoalIndexRows(syncedContent).map((r) => r.trim()));
  const toAdd = extensionRows.filter((row) => !existing.has(row.trim()));
  if (toAdd.length === 0) {
    return syncedContent;
  }

  const lines = syncedContent.split('\n');
  let insertAt = lines.length;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i]?.startsWith('|')) {
      insertAt = i + 1;
      break;
    }
  }

  const merged = [...lines.slice(0, insertAt), ...toAdd, ...lines.slice(insertAt)];
  return merged.join('\n');
}

/** Format a new goal-index row for an extension buyer skill. */
export function formatExtensionGoalIndexRow(triggerPhrase: string, goalStem: string): string {
  return `| "${triggerPhrase}" | \`extensions/skills/${goalStem}.md\` |`;
}
