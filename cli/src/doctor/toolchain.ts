import {
  dataConfigSchema,
  type EnvSource,
  hostingConfigSchema,
  isRailwayStackActive,
  needsAwsCliFromAuxiliaryProviders,
  parseEnv,
  resolveEnvProvider,
  resolveOptionalEnvProvider,
} from '@vybekiit/core';
import {
  ATLAS,
  AWS,
  DECLARED_AGENT_TOOLS,
  DECLARED_ALL_TOOLS,
  DECLARED_TOOLCHAIN,
  EAS,
  GCLOUD,
  GH,
  LAUNCH,
  RAILWAY,
  SUPABASE,
  VERCEL,
  WRANGLER,
} from './toolDeclarations';

/** OS families doctor knows how to install on. */
export type Platform = 'darwin' | 'win32' | 'linux';

export type InstallStep = {
  readonly command: string;
  readonly args: readonly string[];
  readonly requires?: string;
};

export type AuthProbe = {
  readonly command: string;
  readonly args: readonly string[];
  readonly loginHint: string;
};

export type Tool = {
  readonly name: string;
  readonly purpose: string;
  readonly versionArgs: readonly string[];
  readonly install: Readonly<Record<Platform, InstallStep>>;
  readonly auth?: AuthProbe;
};

/** Agent-runtime CLIs always checked by doctor. */
export const AGENT_TOOLS: readonly Tool[] = DECLARED_AGENT_TOOLS;

/** Default provider toolchain for a web project. */
export const TOOLCHAIN: readonly Tool[] = DECLARED_TOOLCHAIN;

/** Every known doctor tool declaration. */
export const ALL_TOOLS: readonly Tool[] = DECLARED_ALL_TOOLS;

/**
 * Resolve a tool declaration by executable name.
 *
 * @param name - Executable name to find.
 * @returns Matching tool declaration, or undefined when unknown.
 * @example
 * const gh = findToolByName('gh');
 */
export const findToolByName = (name: string): Tool | undefined =>
  ALL_TOOLS.find((tool) => tool.name === name);

export type ToolchainOptions = {
  readonly mobile?: boolean;
  readonly wantsGoogleAuth?: boolean;
};

type ToolCollector = {
  readonly tools: Tool[];
  readonly add: (tool: Tool | undefined) => void;
};

/**
 * Create a deduping tool collector.
 *
 * @returns Mutable collector that preserves first-seen order.
 * @example
 * const collector = createToolCollector();
 */
const createToolCollector = (): ToolCollector => {
  const tools: Tool[] = [];
  return {
    tools,
    add: (tool) => {
      if (tool !== undefined && !tools.includes(tool)) {
        tools.push(tool);
      }
    },
  };
};

/**
 * Resolve the hosting CLI from the hosting provider registry.
 *
 * @param provider - Parsed hosting provider.
 * @param env - Environment source.
 * @returns Tool needed by the hosting provider.
 * @example
 * const tool = resolveHostingTool('cloudflare', process.env);
 */
const resolveHostingTool = (provider: string, env: EnvSource): Tool =>
  resolveEnvProvider(
    provider,
    {
      aws: () => AWS,
      vercel: () => VERCEL,
      railway: () => RAILWAY,
      cloudflare: () => WRANGLER,
    },
    env,
    'cloudflare',
  );

/**
 * Resolve the optional data CLI from the data provider registry.
 *
 * @param provider - Parsed data provider.
 * @param env - Environment source.
 * @returns Tool needed by the data provider, or undefined when no CLI is needed.
 * @example
 * const tool = resolveDataTool('supabase', process.env);
 */
const resolveDataTool = (provider: string, env: EnvSource): Tool | undefined =>
  resolveOptionalEnvProvider(
    provider,
    {
      mongodb: () => ATLAS,
      aws: () => AWS,
      neon: () => undefined,
      firebase: () => undefined,
      local: () => undefined,
      railway: () => undefined,
      supabase: () => SUPABASE,
    },
    env,
    'supabase',
  );

/**
 * Pick the CLIs the buyer's active providers need.
 *
 * @param env - Environment source, typically `process.env`.
 * @param options - Context that provider env keys do not carry.
 * @returns Ordered, deduped doctor tools.
 * @example
 * const tools = selectToolchain(process.env, { mobile: true });
 */
export const selectToolchain = (
  env: Record<string, string | undefined>,
  options: ToolchainOptions = {},
): Tool[] => {
  const envSource: EnvSource = env;
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, envSource);
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, envSource);
  const collector = createToolCollector();

  collector.add(GH);
  collector.add(resolveHostingTool(HOSTING_PROVIDER, envSource));
  if (isRailwayStackActive(envSource) && HOSTING_PROVIDER !== 'railway') {
    collector.add(RAILWAY);
  }
  collector.add(resolveDataTool(DATA_PROVIDER, envSource));
  if (needsAwsCliFromAuxiliaryProviders(envSource)) {
    collector.add(AWS);
  }
  if (
    options.wantsGoogleAuth === true ||
    (env.GOOGLE_OAUTH_CLIENT_ID !== undefined && env.GOOGLE_OAUTH_CLIENT_ID !== '')
  ) {
    collector.add(GCLOUD);
  }
  if (options.mobile === true) {
    collector.add(EAS);
    collector.add(LAUNCH);
  }

  return collector.tools;
};

/**
 * Merge agent-runtime tools with provider-selected cloud CLIs.
 *
 * @param providerTools - Provider and native tools selected for this project.
 * @returns Ordered, deduped full doctor toolchain.
 * @example
 * const tools = mergeAgentAndProviderTools(selectToolchain(process.env));
 */
export const mergeAgentAndProviderTools = (providerTools: readonly Tool[]): Tool[] => {
  const collector = createToolCollector();
  for (const tool of AGENT_TOOLS) {
    collector.add(tool);
  }
  for (const tool of providerTools) {
    collector.add(tool);
  }
  return collector.tools;
};

/**
 * Check whether at least one agent runtime is installed.
 *
 * @param reports - Tool reports produced by doctor.
 * @returns True when an agent runtime is available.
 * @example
 * const ready = isAgentRuntimeReady(reports);
 */
export const isAgentRuntimeReady = (reports: readonly ToolReport[]): boolean =>
  reports.some(
    (report) => (report.tool === 'claude' || report.tool === 'codex') && report.installed,
  );

/**
 * Check whether the skills CLI is installed.
 *
 * @param reports - Tool reports produced by doctor.
 * @returns True when the skills CLI is installed.
 * @example
 * const ready = isSkillsCliReady(reports);
 */
export const isSkillsCliReady = (reports: readonly ToolReport[]): boolean =>
  reports.some((report) => report.tool === 'skills' && report.installed);

export type ToolPresence = {
  readonly tool: string;
  readonly present: boolean;
};

export type InstallAction = InstallStep & {
  readonly tool: string;
};

/**
 * Plan install commands for tools that are not present.
 *
 * @param platform - Current OS family.
 * @param presence - Tool presence observations.
 * @param tools - Tool declarations to install when missing.
 * @returns Install actions in toolchain order.
 * @example
 * const actions = planInstall('darwin', presence, tools);
 */
export const planInstall = (
  platform: Platform,
  presence: readonly ToolPresence[],
  tools: readonly Tool[] = TOOLCHAIN,
): InstallAction[] => {
  const missing = new Set(presence.filter((item) => !item.present).map((item) => item.tool));
  return tools
    .filter((tool) => missing.has(tool.name))
    .map((tool) => ({ tool: tool.name, ...tool.install[platform] }));
};

export type ToolReport = {
  readonly tool: string;
  readonly purpose: string;
  readonly installed: boolean;
  readonly authed: boolean | null;
  readonly missingRequirement?: string;
  readonly loginHint?: string;
};

/**
 * Render tool reports as buyer-readable lines.
 *
 * @param reports - Final tool reports.
 * @returns Human-readable report lines.
 * @example
 * const lines = formatReport(reports);
 */
export const formatReport = (reports: readonly ToolReport[]): string[] =>
  reports.map((report) => {
    if (!report.installed) {
      const fix =
        report.missingRequirement === undefined
          ? ' Re-run to try again.'
          : ` Install ${report.missingRequirement} first, then re-run.`;
      return `✗ ${report.tool} - couldn't be set up (needed to ${report.purpose}).${fix}`;
    }
    if (report.authed === false) {
      return `→ ${report.tool} - installed, but you're not signed in yet. One-time: run \`${report.loginHint}\`.`;
    }
    return `✓ ${report.tool} - ready (used to ${report.purpose}).`;
  });

/**
 * Check whether every required tool is installed and signed in when needed.
 *
 * @param reports - Tool reports produced by doctor.
 * @returns True when the toolchain is ready.
 * @example
 * const ready = isToolchainReady(reports);
 */
export const isToolchainReady = (reports: readonly ToolReport[]): boolean =>
  reports.every((report) => report.installed && report.authed !== false);
