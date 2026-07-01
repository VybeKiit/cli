import type { TemplateId } from '../catalogs/goalCatalog';
import {
  checkBaseManifestParity,
  mergePlatformSkillsManifests,
  type PlatformSkillsTemplateManifest,
} from '../catalogs/platformSkillsMerge';
import { checkAgentSkillSymlinks, checkBuyerSkillStubDrift } from '../render/buyerSkillStubs';
import { checkGoalDrift } from './planGoalRouting';
import {
  planAgentRuntimeCompliance,
  type AgentRuntimeComplianceInput,
} from './planAgentRuntimeCompliance';
import { GENERATED_SECTION_MARKERS, type GeneratedSectionId } from '../render/markdown';

export type AgentLayerComplianceCheckId =
  | 'generated-markers'
  | 'checklist-structure'
  | 'buyer-context'
  | 'goal-drift'
  | 'goal-index-drift'
  | 'session-bootstrap'
  | 'buyer-skill-stub-drift'
  | 'agent-skill-symlinks'
  | 'platform-skills-manifest-parity'
  | import('./planAgentRuntimeCompliance').AgentRuntimeComplianceCheckId;

export interface AgentLayerComplianceIssue {
  readonly check: AgentLayerComplianceCheckId;
  readonly message: string;
  readonly file?: string;
}

export interface AgentLayerComplianceInput {
  readonly template: TemplateId;
  readonly files: Readonly<Record<string, string>>;
  readonly skillPaths: readonly string[];
  readonly skillContents?: Readonly<Record<string, string>>;
  readonly buyerSkillStubContents?: Readonly<Record<string, string>>;
  readonly agentSkillSymlinkStates?: Readonly<
    Record<string, { readonly isSymlink: boolean; readonly target: string | null }>
  >;
  readonly platformSkillContents?: Readonly<Record<string, string>>;
  readonly platformSkillsManifest?: PlatformSkillsTemplateManifest;
  readonly liveDocs?: Readonly<Record<string, string>>;
}

export interface AgentLayerComplianceReport {
  readonly template: TemplateId;
  readonly issues: readonly AgentLayerComplianceIssue[];
  readonly ok: boolean;
}

const MARKER_REQUIREMENTS: readonly { file: string; sectionId: GeneratedSectionId }[] = [
  { file: 'checklist.md', sectionId: 'production-gates' },
  { file: '.vybekiit/agent/tech-references.md', sectionId: 'tech-references' },
  { file: '.vybekiit/agent/session-bootstrap.md', sectionId: 'session-bootstrap' },
];

function hasMarker(content: string, sectionId: GeneratedSectionId): boolean {
  return content.includes(GENERATED_SECTION_MARKERS.start(sectionId));
}

/**
 * Validate buyer agent-layer structure — pure; CLI reads disk and passes contents.
 */
export function planAgentLayerCompliance(
  input: AgentLayerComplianceInput,
): AgentLayerComplianceReport {
  const issues: AgentLayerComplianceIssue[] = [];
  const { template, files, skillPaths } = input;

  for (const req of MARKER_REQUIREMENTS) {
    const content = files[req.file];
    if (content === undefined) {
      issues.push({
        check: 'generated-markers',
        message: `Missing required file: ${req.file}`,
        file: req.file,
      });
      continue;
    }
    if (!hasMarker(content, req.sectionId)) {
      issues.push({
        check: 'generated-markers',
        message: `Missing generated marker for ${req.sectionId} in ${req.file}`,
        file: req.file,
      });
    }
  }

  const language = files['language.md'];
  if (language !== undefined && !language.includes('vybekiit:generated:start')) {
    issues.push({
      check: 'generated-markers',
      message: 'language.md has no vybekiit:generated sections — run render-agent-layer',
      file: 'language.md',
    });
  }

  const agents = files['AGENTS.md'];
  if (agents !== undefined && !hasMarker(agents, 'contract')) {
    issues.push({
      check: 'generated-markers',
      message: 'AGENTS.md missing contract generated section — run render-agent-layer',
      file: 'AGENTS.md',
    });
  }

  const checklist = files['checklist.md'];
  if (checklist !== undefined) {
    if (!checklist.includes('## Decision log')) {
      issues.push({
        check: 'checklist-structure',
        message: 'checklist.md missing ## Decision log header',
        file: 'checklist.md',
      });
    }
    if (!checklist.includes('Agent appends dated entries')) {
      issues.push({
        check: 'checklist-structure',
        message: 'checklist.md missing append-only decision log comment',
        file: 'checklist.md',
      });
    }
  }

  const context = files['CONTEXT.md'];
  if (context === undefined || !context.trimStart().startsWith('# CONTEXT.md')) {
    issues.push({
      check: 'buyer-context',
      message: 'CONTEXT.md must exist with # CONTEXT.md header (owned app glossary)',
      file: 'CONTEXT.md',
    });
  }

  const bootstrap = files['.vybekiit/agent/session-bootstrap.md'];
  if (bootstrap === undefined) {
    issues.push({
      check: 'session-bootstrap',
      message: 'Missing .vybekiit/agent/session-bootstrap.md',
      file: '.vybekiit/agent/session-bootstrap.md',
    });
  }

  const drift = checkGoalDrift(template, skillPaths);
  for (const issue of drift.issues) {
    issues.push({
      check: issue.issue === 'missing_skill' ? 'goal-drift' : 'goal-drift',
      message: `${issue.issue}: ${issue.skillPath} (goal ${issue.goalId})`,
      file: issue.skillPath,
    });
  }

  if (template === 'web') {
    const goalIndex = files['.vybekiit/agent/goal-index.md'];
    if (goalIndex) {
      const indexed = [...goalIndex.matchAll(/`skills\/([a-z0-9-]+)\.md`/g)].map(
        (m) => `.vybekiit/skills/${m[1]}.md`,
      );
      for (const path of indexed) {
        if (!skillPaths.includes(path)) {
          issues.push({
            check: 'goal-index-drift',
            message: `goal-index references missing skill: ${path}`,
            file: '.vybekiit/agent/goal-index.md',
          });
        }
      }
    }
  }

  const skillContents = input.skillContents ?? {};
  if (Object.keys(skillContents).length > 0) {
    const stubDrift = checkBuyerSkillStubDrift(
      template,
      skillContents,
      input.buyerSkillStubContents ?? {},
    );
    for (const issue of stubDrift.issues) {
      issues.push({
        check: 'buyer-skill-stub-drift',
        message: `${issue.issue}: ${issue.stubPath} (from ${issue.buyerPath}) — run render-agent-layer`,
        file: issue.stubPath,
      });
    }
  }

  if (input.agentSkillSymlinkStates) {
    const symlinkReport = checkAgentSkillSymlinks(input.agentSkillSymlinkStates);
    for (const issue of symlinkReport.issues) {
      issues.push({
        check: 'agent-skill-symlinks',
        message: `${issue.issue}: ${issue.link} → expected ${issue.expectedTarget}${
          issue.actualTarget ? `, got ${issue.actualTarget}` : ''
        } — run render-agent-layer`,
        file: issue.link,
      });
    }
  }

  if (input.platformSkillsManifest) {
    const merged = mergePlatformSkillsManifests(input.platformSkillsManifest);
    const missingBase = checkBaseManifestParity(merged);
    for (const repo of missingBase) {
      issues.push({
        check: 'platform-skills-manifest-parity',
        message: `Merged platform-skills manifest missing base repo: ${repo}`,
        file: 'platform-skills.manifest.json',
      });
    }
  }

  const runtimeInput: AgentRuntimeComplianceInput = {
    files,
    skillContents,
    platformSkillContents: input.platformSkillContents ?? {},
    ...(input.liveDocs === undefined ? {} : { liveDocs: input.liveDocs }),
  };
  const runtime = planAgentRuntimeCompliance(runtimeInput);
  for (const issue of runtime.issues) {
    issues.push({
      check: issue.check,
      message: issue.message,
      ...(issue.file === undefined ? {} : { file: issue.file }),
    });
  }

  return { template, issues, ok: issues.length === 0 };
}
