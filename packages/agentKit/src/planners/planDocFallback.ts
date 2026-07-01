import {
  TECH_REFERENCE_MAP,
  TECH_REFERENCES,
  type TechReference,
} from '../catalogs/techReferences';

export interface DocFallbackPlan {
  readonly techId: string;
  readonly label: string;
  readonly docsUrl: string;
  readonly apiRefUrl?: string;
  readonly mcpDocsUrl?: string;
  readonly mcpSnippet?: string;
  readonly troubleshootingUrl?: string;
  readonly builderMessage: string;
  readonly suggestedSteps: readonly string[];
  readonly found: boolean;
}

const BUILDER_STUCK_MESSAGE =
  "I'm double-checking the official setup guide for this — hang tight, I'll have the next step in a moment.";

/** Plain phrase the agent says to the builder when MCP or first debug attempt fails. */
export function formatBuilderStuckMessage(): string {
  return BUILDER_STUCK_MESSAGE;
}

function defaultSteps(ref: TechReference): string[] {
  const steps = [`Open official docs: ${ref.docsUrl}`];
  if (ref.mcpDocsUrl) {
    steps.push(`If MCP is configured, verify connection to ${ref.mcpDocsUrl}`);
    steps.push(
      'On MCP failure: run `vybekiit doc-fallback ' +
        ref.id +
        '` and follow docs without naming MCP to the builder',
    );
  }
  if (ref.envKeys?.length) {
    steps.push(`Confirm secret settings in .env.example: ${ref.envKeys.join(', ')}`);
  }
  if (ref.troubleshootingPath) {
    steps.push(`Troubleshooting: ${ref.troubleshootingPath}`);
  }
  steps.push(`Tell the builder: "${BUILDER_STUCK_MESSAGE}"`);
  return steps;
}

/**
 * Return official doc URLs and agent steps when stuck on a provider integration.
 */
export function planDocFallback(techId: string, _context?: string): DocFallbackPlan {
  const ref = TECH_REFERENCE_MAP[techId];
  if (!ref) {
    return {
      techId,
      label: techId,
      docsUrl: '',
      builderMessage: BUILDER_STUCK_MESSAGE,
      suggestedSteps: [
        `Unknown tech id "${techId}". Known ids: ${TECH_REFERENCES.map((r) => r.id).join(', ')}`,
        `Tell the builder: "${BUILDER_STUCK_MESSAGE}"`,
      ],
      found: false,
    };
  }

  return {
    techId: ref.id,
    label: ref.label,
    docsUrl: ref.docsUrl,
    ...(ref.apiRefUrl ? { apiRefUrl: ref.apiRefUrl } : {}),
    ...(ref.mcpDocsUrl ? { mcpDocsUrl: ref.mcpDocsUrl } : {}),
    ...(ref.mcpSnippet ? { mcpSnippet: ref.mcpSnippet } : {}),
    ...(ref.troubleshootingPath ? { troubleshootingUrl: ref.troubleshootingPath } : {}),
    builderMessage: BUILDER_STUCK_MESSAGE,
    suggestedSteps: defaultSteps(ref),
    found: true,
  };
}
