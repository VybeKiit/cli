/** Row in goal-index pointing at an extension skill. */
const EXTENSION_SKILL_PATH_RE = /extensions\/skills\/[a-z0-9-]+\.md/;

/**
 * Extract goal-index table rows that reference extension skills (buyer-owned).
 *
 * @param goalIndexContent - goal index content input.
 * @returns The extract extension goal index rows entries.
 * @example
 * const result = extractExtensionGoalIndexRows(goalIndexContent);
 */
export const extractExtensionGoalIndexRows = (goalIndexContent: string): string[] => {
  const rows: string[] = [];
  for (const line of goalIndexContent.split('\n')) {
    if (line.startsWith('|') && EXTENSION_SKILL_PATH_RE.test(line)) {
      rows.push(line);
    }
  }
  return rows;
};

/**
 * Merge extension goal-index rows from buyer copy into freshly synced maintainer copy.
 *
 * @param syncedContent - synced content input.
 * @param buyerContent - buyer content input.
 * @returns The rendered merge goal index on sync text.
 * @example
 * const result = mergeGoalIndexOnSync(syncedContent, buyerContent);
 */
export const mergeGoalIndexOnSync = (
  syncedContent: string,
  buyerContent: string | undefined,
): string => {
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
};

/**
 * Format a new goal-index row for an extension buyer skill.
 *
 * @param triggerPhrase - trigger phrase input.
 * @param goalStem - goal stem input.
 * @returns The rendered format extension goal index row text.
 * @example
 * const result = formatExtensionGoalIndexRow(triggerPhrase, goalStem);
 */
export const formatExtensionGoalIndexRow = (triggerPhrase: string, goalStem: string): string =>
  `| "${triggerPhrase}" | \`extensions/skills/${goalStem}.md\` |`;
