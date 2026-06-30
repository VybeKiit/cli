export type GeneratedSectionId =
  | 'contract'
  | 'tone'
  | 'sdlc-vocabulary'
  | 'ui-vocabulary'
  | 'tool-vocabulary'
  | 'failure-vocabulary'
  | 'payments-vocabulary'
  | 'web-ui-sources'
  | 'goal-index-validation'
  | 'tech-references'
  | 'production-gates'
  | 'session-bootstrap';

export const GENERATED_SECTION_MARKERS = {
  start: (id: GeneratedSectionId) => `<!-- vybekiit:generated:start ${id} -->`,
  end: (id: GeneratedSectionId) => `<!-- vybekiit:generated:end ${id} -->`,
} as const;

/**
 * Wrap content in HTML comment markers so sync can replace in-place without clobbering prose.
 */
export function wrapGeneratedSection(id: GeneratedSectionId, content: string): string {
  return [
    GENERATED_SECTION_MARKERS.start(id),
    content.trim(),
    GENERATED_SECTION_MARKERS.end(id),
  ].join('\n');
}

/**
 * Replace or append a generated section inside a markdown file.
 */
export function replaceGeneratedSection(
  fileContent: string,
  id: GeneratedSectionId,
  newContent: string,
): string {
  const wrapped = wrapGeneratedSection(id, newContent);
  const start = GENERATED_SECTION_MARKERS.start(id);
  const end = GENERATED_SECTION_MARKERS.end(id);
  const startIdx = fileContent.indexOf(start);
  const endIdx = fileContent.indexOf(end);

  if (startIdx !== -1 && endIdx !== -1) {
    const before = fileContent.slice(0, startIdx);
    const after = fileContent.slice(endIdx + end.length);
    return `${before}${wrapped}${after}`;
  }

  return `${fileContent.trimEnd()}\n\n${wrapped}\n`;
}
