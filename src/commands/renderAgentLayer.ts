import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import {
  applyAgentLayerSections,
  planBuyerSkillStubOutputs,
  type TemplateId,
} from '@vybekiit/agent-kit';
import {
  listBuyerSkillContents,
  loadAgentLayerRenderInputs,
  selectedTemplate,
  writeAgentLayerRenderOutputs,
} from '../lib/agentLayerIo';
import { ensureAgentSkillSymlinks } from '../lib/agentSkillSymlinks';
import { isTemplateName } from '../lib/scaffold';

/**
 * Write generated buyer skill stubs for the selected template.
 *
 * @param cwd - Project directory containing the buyer agent layer.
 * @param template - Template id used to plan the stubs.
 * @param skillContents - Buyer skill contents keyed by path.
 * @returns Stub paths written by this call.
 * @example
 * const written = await writeBuyerSkillStubs(cwd, 'web', skillContents);
 */
const writeBuyerSkillStubs = async (
  cwd: string,
  template: TemplateId,
  skillContents: Readonly<Record<string, string>>,
): Promise<string[]> => {
  const stubs = planBuyerSkillStubOutputs(template, skillContents);
  await Promise.all(
    stubs.map(async (stub) => {
      const absolute = join(cwd, stub.stubPath);
      await mkdir(dirname(absolute), { recursive: true });
      await writeFile(absolute, stub.content, 'utf8');
    }),
  );

  return stubs.map((stub) => stub.stubPath);
};

/**
 * Template used by the agent-layer render command.
 *
 * @param cwd - Project directory used for template inference.
 * @param templateArg - Optional template argument passed by the caller.
 * @returns Explicit, inferred, or bootstrap-default template id.
 * @example
 * const template = await selectedRenderTemplate(process.cwd(), 'web');
 */
const selectedRenderTemplate = async (cwd: string, templateArg?: string): Promise<TemplateId> => {
  if (templateArg !== undefined && templateArg !== '' && isTemplateName(templateArg)) {
    return templateArg;
  }

  const detected = await selectedTemplate(undefined, cwd);
  if (detected !== null) {
    return detected;
  }

  return 'web';
};

/**
 * Regenerate marked agent-layer sections, buyer Agent Skills stubs, and per-agent symlinks.
 *
 * @param cwd - Project directory containing the agent layer.
 * @param templateArg - Optional template override.
 * @returns Files updated plus the process exit code.
 */
export const runRenderAgentLayer = async (
  cwd: string = process.cwd(),
  templateArg?: string,
): Promise<{
  readonly filesUpdated: readonly string[];
  readonly exitCode: number;
}> => {
  const template = await selectedRenderTemplate(cwd, templateArg);

  const { contents, present } = await loadAgentLayerRenderInputs(cwd);
  const skillContents = await listBuyerSkillContents(cwd);
  const hasBuyerSkills = Object.keys(skillContents).length > 0;

  if (present.length === 0 && !hasBuyerSkills) {
    return { filesUpdated: [], exitCode: 1 };
  }

  const filesUpdated: string[] = [];

  if (present.length > 0) {
    const updated = applyAgentLayerSections(contents, { template });
    filesUpdated.push(...(await writeAgentLayerRenderOutputs(cwd, contents, updated, present)));
  }

  if (hasBuyerSkills) {
    const stubs = await writeBuyerSkillStubs(cwd, template, skillContents);
    filesUpdated.push(...stubs);
    const links = await ensureAgentSkillSymlinks(cwd);
    filesUpdated.push(...links);
  }

  return { filesUpdated, exitCode: 0 };
};
