import type { TemplateId } from '@vybekiit/agent-kit/catalogs/goalCatalog';
import {
  renderChecklistSeed,
  renderProductionGates,
} from '@vybekiit/agent-kit/catalogs/productionGates';
import { renderTechReferencesTable } from '@vybekiit/agent-kit/catalogs/techReferences';
import { renderWebUiSourcesTable } from '@vybekiit/agent-kit/catalogs/uiSources';
import { renderContract } from '@vybekiit/agent-kit/contract/contract';
import {
  renderAgentSessionBootstrap,
  renderSessionBootstrapFile,
} from '@vybekiit/agent-kit/contract/sessionBootstrap';
import { renderToneSection } from '@vybekiit/agent-kit/contract/toneRules';
import { renderAgentRuntimeVocabularyTable } from '@vybekiit/agent-kit/vocabulary/agentRuntimeVocabulary';
import { renderCodeEditVocabularyTable } from '@vybekiit/agent-kit/vocabulary/codeEditVocabulary';
import { renderPaymentsVocabularyTable } from '@vybekiit/agent-kit/vocabulary/domainVocabulary';
import { renderPeopleVocabularyTable } from '@vybekiit/agent-kit/vocabulary/peopleVocabulary';
import { renderSdlcVocabularyTable } from '@vybekiit/agent-kit/vocabulary/sdlcVocabulary';
import { renderToolVocabularyTable } from '@vybekiit/agent-kit/vocabulary/toolVocabulary';
import {
  renderAgentInternalVocabularyTable,
  renderFailureVocabularyTable,
  renderUiVocabularyTable,
} from '@vybekiit/agent-kit/vocabulary/uiVocabulary';
import { renderVybekiitLayerVocabularyTable } from '@vybekiit/agent-kit/vocabulary/vybekiitLayerVocabulary';
import { type GeneratedSectionId, replaceGeneratedSection, wrapGeneratedSection } from './markdown';

export type AgentLayerRenderTarget = {
  readonly file: string;
  readonly sectionId: GeneratedSectionId;
};

/** Files and section ids that sync-agent-layer / render-agent-layer regenerate. */
export const AGENT_LAYER_RENDER_TARGETS: readonly AgentLayerRenderTarget[] = [
  { file: 'AGENTS.md', sectionId: 'contract' },
  { file: 'language.md', sectionId: 'tone' },
  { file: 'language.md', sectionId: 'people-vocabulary' },
  { file: 'language.md', sectionId: 'sdlc-vocabulary' },
  { file: 'language.md', sectionId: 'ui-vocabulary' },
  { file: 'language.md', sectionId: 'tool-vocabulary' },
  { file: 'language.md', sectionId: 'agent-runtime-vocabulary' },
  { file: 'language.md', sectionId: 'code-edit-vocabulary' },
  { file: 'language.md', sectionId: 'vybekiit-layer-vocabulary' },
  { file: 'language.md', sectionId: 'failure-vocabulary' },
  { file: 'language.md', sectionId: 'payments-vocabulary' },
  { file: 'language.md', sectionId: 'agent-internal-vocabulary' },
  { file: '.vybekiit/agent/ui-sources.md', sectionId: 'web-ui-sources' },
  { file: '.vybekiit/agent/tech-references.md', sectionId: 'tech-references' },
  { file: 'checklist.md', sectionId: 'production-gates' },
  { file: '.vybekiit/agent/session-bootstrap.md', sectionId: 'session-bootstrap' },
];

/** Unique markdown paths render/sync commands read before applying sections. */
export const AGENT_LAYER_RENDER_FILES: readonly string[] = [
  ...new Set([
    ...AGENT_LAYER_RENDER_TARGETS.map((target) => target.file),
    '.vybekiit/agent/goal-index.md',
  ]),
];

export type ApplyAgentLayerOptions = {
  readonly template?: TemplateId;
};

type AgentLayerSectionRenderer = (template: TemplateId) => string;

const SECTION_RENDERERS: Readonly<Record<GeneratedSectionId, AgentLayerSectionRenderer>> = {
  contract: () => renderContract(),
  tone: () => renderToneSection(),
  'people-vocabulary': () =>
    ['## Who you are talking to', '', renderPeopleVocabularyTable()].join('\n'),
  'sdlc-vocabulary': () =>
    ['## Quality and saving your work', '', renderSdlcVocabularyTable()].join('\n'),
  'ui-vocabulary': () => ['## UI building blocks', '', renderUiVocabularyTable()].join('\n'),
  'tool-vocabulary': () =>
    ['## Your assistant (never name the tool)', '', renderToolVocabularyTable()].join('\n'),
  'agent-runtime-vocabulary': () =>
    ['## Your assistant at work (runtime)', '', renderAgentRuntimeVocabularyTable()].join('\n'),
  'code-edit-vocabulary': () =>
    ['## When you change their app (outcome-only)', '', renderCodeEditVocabularyTable()].join('\n'),
  'vybekiit-layer-vocabulary': () =>
    ['## How the kit works (invisible to them)', '', renderVybekiitLayerVocabularyTable()].join(
      '\n',
    ),
  'failure-vocabulary': () =>
    ['## When something goes wrong', '', renderFailureVocabularyTable()].join('\n'),
  'payments-vocabulary': () =>
    ['## Payments & tax', '', renderPaymentsVocabularyTable()].join('\n'),
  'agent-internal-vocabulary': () =>
    ['## Agent-internal — never say', '', renderAgentInternalVocabularyTable()].join('\n'),
  'web-ui-sources': () => ['# Approved UI block sources', '', renderWebUiSourcesTable()].join('\n'),
  'tech-references': () => renderTechReferencesTable(),
  'production-gates': (template) => renderProductionGates(template),
  'session-bootstrap': () => renderAgentSessionBootstrap(),
  'goal-index-validation': () =>
    '<!-- Goal drift: run `vybekiit check-goals` — non-zero exit means fix goal-index or add skills -->',
};

const renderSectionContent = (
  sectionId: GeneratedSectionId,
  template: TemplateId = 'web',
): string => SECTION_RENDERERS[sectionId](template);

/**
 * Render all agent-layer sections keyed by section id.
 *
 * @param template - template input.
 * @returns The render agent layer sections result.
 * @example
 * const result = renderAgentLayerSections(template);
 */
export const renderAgentLayerSections = (
  template: TemplateId = 'web',
): Readonly<Record<GeneratedSectionId, string>> => {
  const ids: GeneratedSectionId[] = [
    'contract',
    'tone',
    'people-vocabulary',
    'sdlc-vocabulary',
    'ui-vocabulary',
    'tool-vocabulary',
    'agent-runtime-vocabulary',
    'code-edit-vocabulary',
    'vybekiit-layer-vocabulary',
    'failure-vocabulary',
    'payments-vocabulary',
    'agent-internal-vocabulary',
    'web-ui-sources',
    'tech-references',
    'production-gates',
    'session-bootstrap',
    'goal-index-validation',
  ];
  return Object.fromEntries(ids.map((id) => [id, renderSectionContent(id, template)])) as Record<
    GeneratedSectionId,
    string
  >;
};

/**
 * Apply rendered sections to file contents (pure — caller reads/writes disk).
 *
 * @param files - files input.
 * @param options - options input.
 * @returns The apply agent layer sections result.
 * @example
 * const result = applyAgentLayerSections(files, options);
 */
export const applyAgentLayerSections = (
  files: Readonly<Record<string, string>>,
  options: ApplyAgentLayerOptions = {},
): Record<string, string> => {
  const template = options.template === undefined ? 'web' : options.template;
  const sections = renderAgentLayerSections(template);
  const out: Record<string, string> = { ...files };

  for (const target of AGENT_LAYER_RENDER_TARGETS) {
    const current = out[target.file];
    const content = sections[target.sectionId];
    if (current !== undefined && content.length > 0) {
      out[target.file] = replaceGeneratedSection(current, target.sectionId, content);
    }
  }

  if (out['.vybekiit/agent/goal-index.md']) {
    const footer = wrapGeneratedSection('goal-index-validation', sections['goal-index-validation']);
    const gi = out['.vybekiit/agent/goal-index.md'];
    if (!gi.includes('vybekiit:generated:start goal-index-validation')) {
      out['.vybekiit/agent/goal-index.md'] = `${gi.trimEnd()}\n\n${footer}\n`;
    }
  }

  if (!out['checklist.md']) {
    out['checklist.md'] = renderChecklistSeed(template);
  }

  if (!out['.vybekiit/agent/session-bootstrap.md']) {
    out['.vybekiit/agent/session-bootstrap.md'] = renderSessionBootstrapFile();
  }

  return out;
};
