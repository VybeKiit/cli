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

/** Tool declaration by executable name, or undefined when unknown. */
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

/** Deduping tool collector that preserves first-seen order. */
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

/** Hosting CLI for the active hosting provider (ADR-0018 registry). */
const hostingCliForProvider = (provider: string, processEnv: EnvSource): Tool =>
  resolveEnvProvider(
    provider,
    {
      aws: () => AWS,
      vercel: () => VERCEL,
      railway: () => RAILWAY,
      cloudflare: () => WRANGLER,
      'github-pages': () => GH,
    },
    processEnv,
    'cloudflare',
  );

/** Optional data CLI for the active data provider (no CLI → undefined). */
const dataCliForProvider = (provider: string, processEnv: EnvSource): Tool | undefined =>
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
    processEnv,
    'supabase',
  );

/**
 * Pick the CLIs the buyer's active providers need.
 * Pipeline: GH → hosting → Railway (decoupled) → data → AWS auxiliary → gcloud → mobile.
 */
export const selectToolchain = (
  processEnv: Record<string, string | undefined>,
  surface: ToolchainOptions = {},
): Tool[] => {
  const envSource: EnvSource = processEnv;
  const { HOSTING_PROVIDER } = parseEnv(hostingConfigSchema, envSource);
  const { DATA_PROVIDER } = parseEnv(dataConfigSchema, envSource);
  const collector = createToolCollector();

  collector.add(GH);
  collector.add(hostingCliForProvider(HOSTING_PROVIDER, envSource));
  if (isRailwayStackActive(envSource) && HOSTING_PROVIDER !== 'railway') {
    collector.add(RAILWAY);
  }
  collector.add(dataCliForProvider(DATA_PROVIDER, envSource));
  if (needsAwsCliFromAuxiliaryProviders(envSource)) {
    collector.add(AWS);
  }
  if (
    surface.wantsGoogleAuth === true ||
    (processEnv.GOOGLE_OAUTH_CLIENT_ID !== undefined && processEnv.GOOGLE_OAUTH_CLIENT_ID !== '')
  ) {
    collector.add(GCLOUD);
  }
  if (surface.mobile === true) {
    collector.add(EAS);
    collector.add(LAUNCH);
  }

  return collector.tools;
};

/** Merge agent-runtime tools with provider-selected cloud CLIs. */
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

/** True when Claude or Codex is installed. */
export const isAgentRuntimeReady = (reports: readonly ToolReport[]): boolean =>
  reports.some(
    (report) => (report.tool === 'claude' || report.tool === 'codex') && report.installed,
  );

/** True when the skills CLI is installed. */
export const isSkillsCliReady = (reports: readonly ToolReport[]): boolean =>
  reports.some((report) => report.tool === 'skills' && report.installed);

export type ToolPresence = {
  readonly tool: string;
  readonly present: boolean;
};

export type InstallAction = InstallStep & {
  readonly tool: string;
};

/** Install actions for tools that are not present, in toolchain order. */
export const planInstall = (
  platform: Platform,
  presence: readonly ToolPresence[],
  tools: readonly Tool[] = TOOLCHAIN,
): InstallAction[] => {
  const missing = new Set(
    presence.filter((observed) => !observed.present).map((observed) => observed.tool),
  );
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

/** Buyer-readable lines for each tool report. */
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

/** True when every required tool is installed and signed in when needed. */
export const isToolchainReady = (reports: readonly ToolReport[]): boolean =>
  reports.every((report) => report.installed && report.authed !== false);
