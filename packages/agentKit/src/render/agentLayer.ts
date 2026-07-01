import { renderContract } from '../contract/contract';
import {
  renderSessionBootstrapFile,
  renderAgentSessionBootstrap,
} from '../contract/sessionBootstrap';
import { renderToneSection } from '../contract/toneRules';
import { renderWebUiSourcesTable } from '../catalogs/uiSources';
import { renderTechReferencesTable } from '../catalogs/techReferences';
import { renderProductionGates, renderChecklistSeed } from '../catalogs/productionGates';
import type { TemplateId } from '../catalogs/goalCatalog';
import { renderSdlcVocabularyTable } from '../vocabulary/sdlcVocabulary';
import { renderToolVocabularyTable } from '../vocabulary/toolVocabulary';
import {
  renderAgentInternalVocabularyTable,
  renderFailureVocabularyTable,
  renderUiVocabularyTable,
} from '../vocabulary/uiVocabulary';
import { renderPaymentsVocabularyTable } from '../vocabulary/domainVocabulary';
import { renderPeopleVocabularyTable } from '../vocabulary/peopleVocabulary';
import { renderAgentRuntimeVocabularyTable } from '../vocabulary/agentRuntimeVocabulary';
import { renderCodeEditVocabularyTable } from '../vocabulary/codeEditVocabulary';
import { renderVybekiitLayerVocabularyTable } from '../vocabulary/vybekiitLayerVocabulary';
import { replaceGeneratedSection, wrapGeneratedSection, type GeneratedSectionId } from './markdown';

export interface AgentLayerRenderTarget {
  readonly file: string;
  readonly sectionId: GeneratedSectionId;
}

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

export interface ApplyAgentLayerOptions {
  readonly template?: TemplateId;
}

function renderSectionContent(sectionId: GeneratedSectionId, template: TemplateId = 'web'): string {
  switch (sectionId) {
    case 'contract':
      return renderContract();
    case 'tone':
      return renderToneSection();
    case 'people-vocabulary':
      return ['## Who you are talking to', '', renderPeopleVocabularyTable()].join('\n');
    case 'sdlc-vocabulary':
      return ['## Quality and saving your work', '', renderSdlcVocabularyTable()].join('\n');
    case 'ui-vocabulary':
      return ['## UI building blocks', '', renderUiVocabularyTable()].join('\n');
    case 'tool-vocabulary':
      return ['## Your assistant (never name the tool)', '', renderToolVocabularyTable()].join(
        '\n',
      );
    case 'agent-runtime-vocabulary':
      return ['## Your assistant at work (runtime)', '', renderAgentRuntimeVocabularyTable()].join(
        '\n',
      );
    case 'code-edit-vocabulary':
      return [
        '## When you change their app (outcome-only)',
        '',
        renderCodeEditVocabularyTable(),
      ].join('\n');
    case 'vybekiit-layer-vocabulary':
      return [
        '## How the kit works (invisible to them)',
        '',
        renderVybekiitLayerVocabularyTable(),
      ].join('\n');
    case 'failure-vocabulary':
      return ['## When something goes wrong', '', renderFailureVocabularyTable()].join('\n');
    case 'payments-vocabulary':
      return ['## Payments & tax', '', renderPaymentsVocabularyTable()].join('\n');
    case 'agent-internal-vocabulary':
      return ['## Agent-internal — never say', '', renderAgentInternalVocabularyTable()].join('\n');
    case 'web-ui-sources':
      return ['# Approved UI block sources', '', renderWebUiSourcesTable()].join('\n');
    case 'tech-references':
      return renderTechReferencesTable();
    case 'production-gates':
      return renderProductionGates(template);
    case 'session-bootstrap':
      return renderAgentSessionBootstrap();
    case 'goal-index-validation':
      return '<!-- Goal drift: run `vybekiit check-goals` — non-zero exit means fix goal-index or add skills -->';
    default:
      return '';
  }
}

/** Render all agent-layer sections keyed by section id. */
export function renderAgentLayerSections(
  template: TemplateId = 'web',
): Readonly<Record<GeneratedSectionId, string>> {
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
}

/**
 * Apply rendered sections to file contents (pure — caller reads/writes disk).
 */
export function applyAgentLayerSections(
  files: Readonly<Record<string, string>>,
  options: ApplyAgentLayerOptions = {},
): Record<string, string> {
  const template = options.template ?? 'web';
  const sections = renderAgentLayerSections(template);
  const out: Record<string, string> = { ...files };

  for (const target of AGENT_LAYER_RENDER_TARGETS) {
    const current = out[target.file];
    if (current === undefined) continue;
    const content = sections[target.sectionId];
    if (!content) continue;
    out[target.file] = replaceGeneratedSection(current, target.sectionId, content);
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
}
