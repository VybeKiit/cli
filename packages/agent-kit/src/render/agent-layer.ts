import { renderContract } from '../contract/contract';
import {
  renderSessionBootstrapFile,
  renderAgentSessionBootstrap,
} from '../contract/session-bootstrap';
import { renderToneSection } from '../contract/tone-rules';
import { renderWebUiSourcesTable } from '../catalogs/ui-sources';
import { renderTechReferencesTable } from '../catalogs/tech-references';
import { renderProductionGates, renderChecklistSeed } from '../catalogs/production-gates';
import type { TemplateId } from '../catalogs/goal-catalog';
import { renderSdlcVocabularyTable } from '../vocabulary/sdlc-vocabulary';
import { renderToolVocabularyTable } from '../vocabulary/tool-vocabulary';
import { renderFailureVocabularyTable, renderUiVocabularyTable } from '../vocabulary/ui-vocabulary';
import { renderPaymentsVocabularyTable } from '../vocabulary/domain-vocabulary';
import { replaceGeneratedSection, wrapGeneratedSection, type GeneratedSectionId } from './markdown';

export interface AgentLayerRenderTarget {
  readonly file: string;
  readonly sectionId: GeneratedSectionId;
}

/** Files and section ids that sync-agent-layer / render-agent-layer regenerate. */
export const AGENT_LAYER_RENDER_TARGETS: readonly AgentLayerRenderTarget[] = [
  { file: 'AGENTS.md', sectionId: 'contract' },
  { file: 'language.md', sectionId: 'tone' },
  { file: 'language.md', sectionId: 'sdlc-vocabulary' },
  { file: 'language.md', sectionId: 'ui-vocabulary' },
  { file: 'language.md', sectionId: 'tool-vocabulary' },
  { file: 'language.md', sectionId: 'failure-vocabulary' },
  { file: 'language.md', sectionId: 'payments-vocabulary' },
  { file: 'BUILDER-VOICE.md', sectionId: 'tone' },
  { file: '.vybekiit/agent/ui-sources.md', sectionId: 'web-ui-sources' },
  { file: '.vybekiit/agent/tech-references.md', sectionId: 'tech-references' },
  { file: 'checklist.md', sectionId: 'production-gates' },
  { file: '.vybekiit/agent/session-bootstrap.md', sectionId: 'session-bootstrap' },
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
    case 'sdlc-vocabulary':
      return ['## Quality and saving your work', '', renderSdlcVocabularyTable()].join('\n');
    case 'ui-vocabulary':
      return ['## UI building blocks', '', renderUiVocabularyTable()].join('\n');
    case 'tool-vocabulary':
      return ['## Your assistant (never name the tool)', '', renderToolVocabularyTable()].join(
        '\n',
      );
    case 'failure-vocabulary':
      return ['## When something goes wrong', '', renderFailureVocabularyTable()].join('\n');
    case 'payments-vocabulary':
      return ['## Payments & tax', '', renderPaymentsVocabularyTable()].join('\n');
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
    'sdlc-vocabulary',
    'ui-vocabulary',
    'tool-vocabulary',
    'failure-vocabulary',
    'payments-vocabulary',
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
