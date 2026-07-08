import { renderContract } from '@vybekiit/agent-kit/contract/contract';

export type ExtensionSkillKind = 'buyer-goal' | 'platform-wrapper' | 'agent-skills-global';

export type BuyerGoalSkillDraft = {
  readonly goalStem: string;
  readonly goalText: string;
  readonly steps: readonly string[];
  readonly definitionOfDone: string;
};

export type PlatformWrapperDraft = {
  readonly techStem: string;
  readonly techLabel: string;
  readonly docsUrl: string;
  readonly kitWiring: readonly string[];
  readonly verifySteps: readonly string[];
  readonly upstreamSkillsRepo?: string;
};

// "**Verify:** Browser shows success" -> true
const VERIFY_MARKER_PATTERN = /\*\*Verify:\*\*/i;

/**
 * Render a Layer A buyer goal skill (project-local VybeKiit format).
 *
 * @param draft - draft input.
 * @returns The rendered render buyer goal extension skill text.
 * @example
 * const result = renderBuyerGoalExtensionSkill(draft);
 */
export const renderBuyerGoalExtensionSkill = (draft: BuyerGoalSkillDraft): string => {
  const steps = draft.steps
    .map((step, i) => {
      const n = i + 1;
      const hasVerify = VERIFY_MARKER_PATTERN.test(step);
      const body = hasVerify ? step : `${step}\n   **Verify:** step ${n} succeeded.`;
      return `${n}. ${body}`;
    })
    .join('\n\n');

  return [
    `# Skill: ${draft.goalStem}`,
    '',
    `**Goal:** ${draft.goalText}`,
    '',
    '**Contract:** one action at a time · verify-before-advance · plain language (`language.md`) ·',
    'translate every error · celebrate. You do all the wiring; the builder only does steps only they can do.',
    '',
    '## Steps',
    '',
    steps,
    '',
    '## If anything breaks',
    '',
    'Run `doctor`. Translate the failure into one plain next step — never paste a stack trace.',
    '',
    '## Definition of done',
    '',
    draft.definitionOfDone,
    '',
    '## After completing this skill',
    '',
    // biome-ignore lint/security/noSecrets: Generated instruction text mentions a function name, not a secret.
    'Append one entry to `checklist.md` Decision log using `formatChecklistEntry({ from, to, because })`.',
    '',
  ].join('\n');
};

/**
 * Render a Layer B platform wrapper (project-local VybeKiit format).
 *
 * @param draft - draft input.
 * @returns The rendered render platform wrapper extension skill text.
 * @example
 * const result = renderPlatformWrapperExtensionSkill(draft);
 */
export const renderPlatformWrapperExtensionSkill = (draft: PlatformWrapperDraft): string => {
  const wiring = draft.kitWiring
    .map((line) => `${draft.kitWiring.length > 1 ? '' : ''}${line}`)
    .join('\n');
  const verify = draft.verifySteps.map((line) => `- ${line}`).join('\n');

  const upstream =
    draft.upstreamSkillsRepo === undefined
      ? ''
      : [
          '',
          '## Upstream skills',
          '',
          `Pin from skills.sh when available: \`npx skills add ${draft.upstreamSkillsRepo} -y\``,
          'Project-local: `.agents/skills/` · Machine-global: use `extend-capabilities-vybekiit` scope ask.',
        ].join('\n');

  return [
    `# Platform wrapper: ${draft.techLabel} (agent-only extension)`,
    '',
    '**Agent-only.** Created by `extend-capabilities-vybekiit` to fill a skill gap.',
    '',
    '## Official upstream',
    '',
    `- Docs: ${draft.docsUrl}`,
    upstream,
    '',
    '## Kit wiring',
    '',
    wiring,
    '',
    '## Verify-before-advance',
    '',
    verify,
    '',
    '## Never say to builder',
    '',
    `${draft.techLabel} and related jargon — use plain language from \`language.md\`.`,
    '',
    '## TODO(vybekiit)',
    '',
    'If no `@vybekiit/*` adapter exists yet, wire with minimal integration and flag for maintainer.',
    '',
  ].join('\n');
};

/**
 * Render Agent Skills SKILL.md for machine-global scope (tool-aware).
 *
 * @param skillStem - skill stem input.
 * @param description - description input.
 * @param bodyMarkdown - body markdown input.
 * @returns The rendered render global agent skill text.
 * @example
 * const result = renderGlobalAgentSkill(skillStem, description, bodyMarkdown);
 */
export const renderGlobalAgentSkill = (
  skillStem: string,
  description: string,
  bodyMarkdown: string,
): string =>
  [
    '---',
    `name: ${skillStem}`,
    `description: ${description}`,
    'metadata:',
    '  vybekiit-generated: extension-skill',
    '---',
    '',
    bodyMarkdown.trimEnd(),
    '',
  ].join('\n');

/**
 * Contract reference block agents can embed in global skill bodies.
 *
 * @returns The rendered render extension contract reference text.
 * @example
 * const result = renderExtensionContractReference();
 */
export const renderExtensionContractReference = (): string => renderContract();
