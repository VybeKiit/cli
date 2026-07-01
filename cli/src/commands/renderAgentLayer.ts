import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import {
  applyAgentLayerSections,
  planBuyerSkillStubOutputs,
  type TemplateId,
} from '@vybekiit/agent-kit';
import { ensureAgentSkillSymlinks } from '../lib/agent-skill-symlinks';
import {
  listBuyerSkillContents,
  loadAgentLayerRenderInputs,
  resolveTemplateArg,
  writeAgentLayerRenderOutputs,
} from '../lib/agent-layer-io';
import { isTemplateName } from '../lib/scaffold';

async function writeBuyerSkillStubs(
  cwd: string,
  template: TemplateId,
  skillContents: Readonly<Record<string, string>>,
): Promise<string[]> {
  const written: string[] = [];
  for (const stub of planBuyerSkillStubOutputs(template, skillContents)) {
    const absolute = join(cwd, stub.stubPath);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, stub.content, 'utf8');
    written.push(stub.stubPath);
  }
  return written;
}

/**
 * Regenerate marked agent-layer sections, buyer Agent Skills stubs, and per-agent symlinks.
 */
export async function runRenderAgentLayer(
  cwd: string = process.cwd(),
  templateArg?: string,
): Promise<{
  readonly filesUpdated: readonly string[];
  readonly exitCode: number;
}> {
  const template: TemplateId =
    (templateArg && isTemplateName(templateArg) ? templateArg : null) ??
    (await resolveTemplateArg(undefined, cwd)) ??
    'web';

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
}
