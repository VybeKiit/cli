import {
  githubRelease,
  homebrewInstall,
  npmEverywhere,
  snapInstall,
  wingetInstall,
} from './installSteps';
import type { Tool } from './toolchain';

const GITHUB_SIGN_IN_FLAGS: readonly string[] = [
  'auth',
  'login',
  '--web',
  '-h',
  'github.com',
  '-p',
  'https',
  '--skip-ssh-key',
];

export const GITHUB_SIGN_IN_COMMAND = `gh ${GITHUB_SIGN_IN_FLAGS.join(' ')}`;

/** GitHub CLI: downloads private template mirrors and verifies GitHub auth. */
export const GH: Tool = {
  name: 'gh',
  purpose: "download your app's starter files and sign you in to GitHub",
  versionArgs: ['--version'],
  install: {
    darwin: githubRelease(
      'cli/cli',
      'gh_{version}_macOS_amd64.zip',
      'gh_{version}_macOS_arm64.zip',
    ),
    win32: githubRelease(
      'cli/cli',
      'gh_{version}_windows_amd64.zip',
      'gh_{version}_windows_arm64.zip',
    ),
    linux: githubRelease(
      'cli/cli',
      'gh_{version}_linux_amd64.tar.gz',
      'gh_{version}_linux_arm64.tar.gz',
    ),
  },
  auth: {
    command: 'gh',
    args: ['auth', 'status'],
    loginHint: GITHUB_SIGN_IN_COMMAND,
    signIn: { command: 'gh', args: GITHUB_SIGN_IN_FLAGS },
  },
};

/** Cloudflare Wrangler CLI for hosting and edge resources. */
export const WRANGLER: Tool = {
  name: 'wrangler',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: npmEverywhere('wrangler'),
  auth: {
    command: 'wrangler',
    args: ['whoami'],
    loginHint: 'wrangler login',
    signedOutText: 'not authenticated',
    signIn: { command: 'wrangler', args: ['login'] },
  },
};

/** Vercel CLI for the Vercel hosting adapter. */
export const VERCEL: Tool = {
  name: 'vercel',
  purpose: 'put your app online',
  versionArgs: ['--version'],
  install: npmEverywhere('vercel'),
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
  install: npmEverywhere('@railway/cli'),
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
    darwin: githubRelease(
      'supabase/cli',
      'supabase_darwin_amd64.tar.gz',
      'supabase_darwin_arm64.tar.gz',
    ),
    win32: githubRelease(
      'supabase/cli',
      'supabase_windows_amd64.tar.gz',
      'supabase_windows_arm64.tar.gz',
    ),
    linux: githubRelease(
      'supabase/cli',
      'supabase_linux_amd64.tar.gz',
      'supabase_linux_arm64.tar.gz',
    ),
  },
  auth: {
    command: 'supabase',
    args: ['projects', 'list'],
    loginHint: 'supabase login',
    signIn: { command: 'supabase', args: ['login'], needsTerminal: true },
  },
};

/** Neon CLI for Neon database projects. */
export const NEON: Tool = {
  name: 'neonctl',
  purpose: 'create and manage your database',
  versionArgs: ['--version'],
  install: npmEverywhere('neonctl'),
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
    darwin: githubRelease(
      'mongodb/mongodb-atlas-cli',
      'mongodb-atlas-cli_{version}_macos_x86_64.zip',
      'mongodb-atlas-cli_{version}_macos_arm64.zip',
    ),
    win32: githubRelease(
      'mongodb/mongodb-atlas-cli',
      'mongodb-atlas-cli_{version}_windows_x86_64.zip',
      'mongodb-atlas-cli_{version}_windows_x86_64.zip',
    ),
    linux: githubRelease(
      'mongodb/mongodb-atlas-cli',
      'mongodb-atlas-cli_{version}_linux_x86_64.tar.gz',
      'mongodb-atlas-cli_{version}_linux_arm64.tar.gz',
    ),
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
    darwin: homebrewInstall('awscli'),
    win32: wingetInstall('Amazon.AWSCLI'),
    linux: snapInstall('aws-cli'),
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
    darwin: homebrewInstall('--cask', 'gcloud-cli'),
    win32: wingetInstall('Google.CloudSDK'),
    linux: snapInstall('google-cloud-cli'),
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
  purpose: 'run Claude Code, your AI coding assistant',
  versionArgs: ['--version'],
  minimumVersion: '2.1.281',
  install: {
    darwin: { kind: 'script', url: 'https://claude.ai/install.sh' },
    win32: {
      kind: 'command',
      command: 'powershell',
      args: [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        'irm https://claude.ai/install.ps1 | iex',
      ],
    },
    linux: { kind: 'script', url: 'https://claude.ai/install.sh' },
  },
};

/** OpenAI Codex CLI agent runtime. */
export const CODEX: Tool = {
  name: 'codex',
  purpose: 'run OpenAI Codex, your AI coding assistant',
  versionArgs: ['--version'],
  install: npmEverywhere('@openai/codex'),
};

/** skills.sh CLI for pinning official platform skills. */
export const SKILLS: Tool = {
  name: 'skills',
  purpose: 'install the official platform skills your app needs',
  versionArgs: ['--version'],
  install: npmEverywhere('skills'),
};

/** EAS CLI for mobile builds. */
export const EAS: Tool = {
  name: 'eas',
  purpose: 'build your app for the app stores',
  versionArgs: ['--version'],
  install: npmEverywhere('eas-cli'),
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
  install: npmEverywhere('launch-store'),
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
