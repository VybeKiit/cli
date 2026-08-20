import type { Tool } from './toolchain';

/** GitHub CLI: downloads private template mirrors and verifies GitHub auth. */
export const GH: Tool = {
  name: 'gh',
  purpose: "download your app's starter files and sign you in to GitHub",
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'gh'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'gh'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'gh'], requires: 'Homebrew' },
  },
  auth: {
    command: 'gh',
    args: ['auth', 'status'],
    loginHint: 'gh auth login --web',
    signIn: { command: 'gh', args: ['auth', 'login', '--web'] },
  },
};

/** Cloudflare Wrangler CLI for hosting and edge resources. */
export const WRANGLER: Tool = {
  name: 'wrangler',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'wrangler'] },
    win32: { command: 'npm', args: ['install', '-g', 'wrangler'] },
    linux: { command: 'npm', args: ['install', '-g', 'wrangler'] },
  },
  auth: {
    command: 'wrangler',
    args: ['whoami'],
    loginHint: 'wrangler login',
    signIn: { command: 'wrangler', args: ['login'] },
  },
};

/** Vercel CLI for the Vercel hosting adapter. */
export const VERCEL: Tool = {
  name: 'vercel',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'vercel'] },
    win32: { command: 'npm', args: ['install', '-g', 'vercel'] },
    linux: { command: 'npm', args: ['install', '-g', 'vercel'] },
  },
  auth: {
    command: 'vercel',
    args: ['whoami'],
    loginHint: 'vercel login',
    signIn: { command: 'vercel', args: ['login'] },
  },
};

/** Railway CLI for Railway hosting and coupled database setup. */
export const RAILWAY: Tool = {
  name: 'railway',
  purpose: 'put your app online and manage your database host',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', '@railway/cli'] },
    win32: { command: 'npm', args: ['install', '-g', '@railway/cli'] },
    linux: { command: 'npm', args: ['install', '-g', '@railway/cli'] },
  },
  auth: {
    command: 'railway',
    args: ['whoami'],
    loginHint: 'railway login',
    signIn: { command: 'railway', args: ['login'] },
  },
};

/** Supabase CLI for the default data adapter. */
export const SUPABASE: Tool = {
  name: 'supabase',
  purpose: 'create and manage your database',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'supabase/tap/supabase'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'supabase'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'supabase/tap/supabase'], requires: 'Homebrew' },
  },
  auth: {
    command: 'supabase',
    args: ['projects', 'list'],
    loginHint: 'supabase login',
    signIn: { command: 'supabase', args: ['login'] },
  },
};

/** Neon CLI for Neon database projects. */
export const NEON: Tool = {
  name: 'neonctl',
  purpose: 'create and manage your database',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'neonctl'] },
    win32: { command: 'npm', args: ['install', '-g', 'neonctl'] },
    linux: { command: 'npm', args: ['install', '-g', 'neonctl'] },
  },
  auth: {
    command: 'neonctl',
    args: ['me'],
    loginHint: 'neonctl auth',
    signIn: { command: 'neonctl', args: ['auth'] },
  },
};

/** MongoDB Atlas CLI for the MongoDB data adapter. */
export const ATLAS: Tool = {
  name: 'atlas',
  purpose: 'create and manage your database',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'mongodb-atlas-cli'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'mongodb-atlas-cli'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'mongodb-atlas-cli'], requires: 'Homebrew' },
  },
  auth: {
    command: 'atlas',
    args: ['auth', 'whoami'],
    loginHint: 'atlas auth login',
    signIn: { command: 'atlas', args: ['auth', 'login'] },
  },
};

/** AWS CLI for AWS-backed adapters. */
export const AWS: Tool = {
  name: 'aws',
  purpose: 'create and manage your cloud services',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', 'awscli'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'aws'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', 'awscli'], requires: 'Homebrew' },
  },
  auth: {
    command: 'aws',
    args: ['sts', 'get-caller-identity'],
    loginHint: 'aws configure sso',
    signIn: { command: 'aws', args: ['configure', 'sso'] },
  },
};

/** Google Cloud CLI for provisioning Google OAuth clients. */
export const GCLOUD: Tool = {
  name: 'gcloud',
  purpose: 'set up sign in with Google for your app',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'brew', args: ['install', '--cask', 'gcloud-cli'], requires: 'Homebrew' },
    win32: { command: 'scoop', args: ['install', 'gcloud'], requires: 'Scoop' },
    linux: { command: 'brew', args: ['install', '--cask', 'gcloud-cli'], requires: 'Homebrew' },
  },
  auth: {
    command: 'gcloud',
    args: ['auth', 'print-access-token'],
    loginHint: 'gcloud auth login',
    signIn: { command: 'gcloud', args: ['auth', 'login'] },
  },
};

/** Claude Code CLI agent runtime. */
export const CLAUDE: Tool = {
  name: 'claude',
  purpose: 'your AI coding assistant (Claude Code)',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
    win32: { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
    linux: { command: 'npm', args: ['install', '-g', '@anthropic-ai/claude-code'] },
  },
};

/** OpenAI Codex CLI agent runtime. */
export const CODEX: Tool = {
  name: 'codex',
  purpose: 'your AI coding assistant (OpenAI Codex)',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', '@openai/codex'] },
    win32: { command: 'npm', args: ['install', '-g', '@openai/codex'] },
    linux: { command: 'npm', args: ['install', '-g', '@openai/codex'] },
  },
};

/** skills.sh CLI for pinning official platform skills. */
export const SKILLS: Tool = {
  name: 'skills',
  purpose: 'install the official platform skills your app needs',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'skills'] },
    win32: { command: 'npm', args: ['install', '-g', 'skills'] },
    linux: { command: 'npm', args: ['install', '-g', 'skills'] },
  },
};

/** EAS CLI for mobile builds. */
export const EAS: Tool = {
  name: 'eas',
  purpose: 'build your app for the app stores',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'eas-cli'] },
    win32: { command: 'npm', args: ['install', '-g', 'eas-cli'] },
    linux: { command: 'npm', args: ['install', '-g', 'eas-cli'] },
  },
  auth: {
    command: 'eas',
    args: ['whoami'],
    loginHint: 'eas login',
    signIn: { command: 'eas', args: ['login'] },
  },
};

/** Launch CLI for mobile app-store submission. */
export const LAUNCH: Tool = {
  name: 'launch',
  purpose: 'publish your app to the app stores',
  versionArgs: ['--version'],
  install: {
    darwin: { command: 'npm', args: ['install', '-g', 'launch-store'] },
    win32: { command: 'npm', args: ['install', '-g', 'launch-store'] },
    linux: { command: 'npm', args: ['install', '-g', 'launch-store'] },
  },
};

/** Agent-runtime CLIs always checked by doctor. */
export const DECLARED_AGENT_TOOLS: readonly Tool[] = [CLAUDE, CODEX, SKILLS];

/** Default provider toolchain for a web project. */
export const DECLARED_TOOLCHAIN: readonly Tool[] = [GH, WRANGLER, SUPABASE];

/** Every known doctor tool declaration. */
export const DECLARED_ALL_TOOLS: readonly Tool[] = [
  GH,
  WRANGLER,
  VERCEL,
  RAILWAY,
  SUPABASE,
  NEON,
  ATLAS,
  AWS,
  GCLOUD,
  CLAUDE,
  CODEX,
  SKILLS,
  EAS,
  LAUNCH,
];
