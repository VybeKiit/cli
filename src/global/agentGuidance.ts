import { constants, existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, realpath, symlink, writeFile } from 'node:fs/promises';
import { delimiter, dirname, join } from 'node:path';
import { BUYER_GUIDANCE } from '@vybekiit/agent-kit';
import { Data, Effect, Schema } from 'effect';

export const AgentInstallationSettings = Schema.Struct({
  homeDirectory: Schema.NonEmptyString,
  claudeDirectory: Schema.NonEmptyString,
  codexDirectory: Schema.NonEmptyString,
  executablePath: Schema.String,
});

export class AgentInstallationError extends Data.TaggedError('AgentInstallationError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const guidanceStart = '<!-- BEGIN VYBEKIIT (managed by `vybekiit setup`) -->';
const guidanceEnd = '<!-- END VYBEKIIT -->';

export const updateAgentInstruction = (previousInstruction: string, instruction: string) => {
  const startAt = previousInstruction.indexOf(guidanceStart);
  const endAt = previousInstruction.indexOf(guidanceEnd);
  const managedInstruction = `${guidanceStart}\n${instruction}\n${guidanceEnd}`;
  if (startAt === -1 && endAt === -1) {
    const separator = previousInstruction.endsWith('\n') || previousInstruction === '' ? '' : '\n';
    return `${previousInstruction}${separator}${managedInstruction}\n`;
  }
  const repeatedMarker =
    previousInstruction.indexOf(guidanceStart, startAt + 1) !== -1 ||
    previousInstruction.indexOf(guidanceEnd, endAt + 1) !== -1;
  if (startAt < 0 || endAt < startAt || repeatedMarker) {
    throw new AgentInstallationError({ message: 'The VybeKiit instruction markers need repair.' });
  }
  return `${previousInstruction.slice(0, startAt)}${managedInstruction}${previousInstruction.slice(endAt + guidanceEnd.length)}`;
};

export const agentInstallationTargets = (
  settings: Schema.Schema.Type<typeof AgentInstallationSettings>,
) => {
  const sharedSkills = join(settings.homeDirectory, '.agents', 'skills');
  const agents = [
    {
      agent: 'claude',
      directory: settings.claudeDirectory,
      instruction: 'CLAUDE.md',
      skills: join(settings.claudeDirectory, 'skills'),
      executable: 'claude',
    },
    {
      agent: 'codex',
      directory: settings.codexDirectory,
      instruction: existsSync(join(settings.codexDirectory, 'AGENTS.override.md'))
        ? 'AGENTS.override.md'
        : 'AGENTS.md',
      skills: sharedSkills,
      executable: 'codex',
    },
    {
      agent: 'grok',
      directory: join(settings.homeDirectory, '.grok'),
      instruction: 'AGENTS.md',
      skills: sharedSkills,
      executable: 'grok',
    },
    {
      agent: 'gemini',
      directory: join(settings.homeDirectory, '.gemini'),
      instruction: 'GEMINI.md',
      skills: sharedSkills,
      executable: 'gemini',
    },
    {
      agent: 'kiro',
      directory: join(settings.homeDirectory, '.kiro'),
      instruction: 'steering/vybekiit.md',
      skills: join(settings.homeDirectory, '.kiro', 'skills'),
      executable: 'kiro-cli',
    },
  ];
  return agents.map((agent) => ({
    ...agent,
    detected:
      existsSync(agent.directory) ||
      settings.executablePath
        .split(delimiter)
        .some(
          (searchDirectory) =>
            searchDirectory !== '' &&
            ['', '.exe', '.cmd'].some((suffix) =>
              existsSync(join(searchDirectory, `${agent.executable}${suffix}`)),
            ),
        ),
  }));
};

export const installAgentGuidance = (
  settings: Schema.Schema.Type<typeof AgentInstallationSettings>,
  agents: ReturnType<typeof agentInstallationTargets>,
  canonicalSkills: string,
  managedSkills: readonly string[],
  version: string,
) =>
  Effect.gen(function* () {
    yield* Effect.all(
      managedSkills.map((skillName) =>
        Effect.tryPromise({
          try: () => readFile(join(canonicalSkills, skillName, 'SKILL.md'), 'utf8'),
          catch: (cause) =>
            new AgentInstallationError({
              message: `The installed skill ${skillName} is missing. No instructions were changed.`,
              cause,
            }),
        }),
      ),
    );
    const guidanceDirectory = join(settings.homeDirectory, '.vybekiit');
    const guidancePath = join(guidanceDirectory, 'agent-guidance.md');
    yield* Effect.tryPromise({
      try: async () => {
        await mkdir(guidanceDirectory, { recursive: true });
        await writeFile(guidancePath, BUYER_GUIDANCE, 'utf8');
      },
      catch: (cause) =>
        new AgentInstallationError({ message: 'Could not install the building guidance.', cause }),
    });
    const installations = yield* Effect.all(
      agents.map((agent) =>
        Effect.gen(function* () {
          if (!agent.detected) {
            return {
              agent: agent.agent,
              status: 'not-detected',
              collisions: [],
              instructionPath: '',
            };
          }
          const instructionPath = join(agent.directory, agent.instruction);
          const installations = yield* Effect.tryPromise({
            try: async () => {
              const previousInstruction = existsSync(instructionPath)
                ? await readFile(instructionPath, 'utf8')
                : '';
              const guidancePointer =
                agent.agent === 'claude'
                  ? '@~/.vybekiit/agent-guidance.md'
                  : `For app-building tasks, read ${JSON.stringify(guidancePath)} before choosing an approach.`;
              const instruction = `${guidancePointer}\nUse its matching VybeKiit skills and reuse the kit's UI, schemas, server and client code.\nSkills: ${JSON.stringify(agent.skills)}. Installed instructions require a fresh agent session.`;
              const nextInstruction = updateAgentInstruction(previousInstruction, instruction);
              await mkdir(dirname(instructionPath), { recursive: true });
              if (previousInstruction !== nextInstruction) {
                if (existsSync(instructionPath)) {
                  await copyFile(
                    instructionPath,
                    `${instructionPath}.vybekiit-backup`,
                    constants.COPYFILE_EXCL,
                  ).catch((failure: unknown) => {
                    if (failure instanceof Error && 'code' in failure && failure.code === 'EEXIST')
                      return;
                    throw failure;
                  });
                }
                await writeFile(instructionPath, nextInstruction, 'utf8');
              }
              await mkdir(agent.skills, { recursive: true });
              return instructionPath;
            },
            catch: (cause) =>
              new AgentInstallationError({
                message: `Could not install ${agent.agent} guidance.`,
                cause,
              }),
          });
          const collisions = yield* Effect.all(
            managedSkills.map((skillName) =>
              Effect.tryPromise({
                try: async () => {
                  const canonicalSkill = join(canonicalSkills, skillName);
                  const agentSkill = join(agent.skills, skillName);
                  if (canonicalSkill === agentSkill) return '';
                  if (existsSync(agentSkill)) {
                    return (await realpath(agentSkill)) === (await realpath(canonicalSkill))
                      ? ''
                      : skillName;
                  }
                  await symlink(canonicalSkill, agentSkill, 'junction');
                  return '';
                },
                catch: (cause) =>
                  new AgentInstallationError({
                    message: `Could not link ${agent.agent} skill ${skillName}.`,
                    cause,
                  }),
              }),
            ),
          );
          const conflictingSkills = collisions.filter((skillName) => skillName !== '');
          return {
            agent: agent.agent,
            status: conflictingSkills.length > 0 ? 'collision' : 'restart-required',
            collisions: conflictingSkills,
            instructionPath: installations,
          };
        }),
      ),
    );
    yield* Effect.tryPromise({
      try: () =>
        writeFile(
          join(guidanceDirectory, 'agents.json'),
          `${JSON.stringify({ version, guidancePath, canonicalSkills, installations }, null, 2)}\n`,
          'utf8',
        ),
      catch: (cause) =>
        new AgentInstallationError({
          message: 'Could not save agent installation progress.',
          cause,
        }),
    });
    return installations;
  });
