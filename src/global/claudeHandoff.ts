import process from 'node:process';
import { runProcess } from './exec';

type ClaudeLauncher = (appPath: string, prompt: string) => Promise<boolean>;

const WINDOWS_CLAUDE_WINDOW_SCRIPT =
  "Start-Process -FilePath 'claude' -ArgumentList ('\"' + $env:VYBEKIIT_CLAUDE_PROMPT + '\"') -WorkingDirectory $env:VYBEKIIT_APP_PATH";

export const claudeTerminalCommand = (appPath: string, prompt: string): string =>
  `cd '${appPath.replaceAll("'", "'\\''")}' && claude '${prompt.replaceAll("'", "'\\''")}'; exec "\${SHELL:-/bin/zsh}" -l`;

export const manualClaudeLine = (prompt: string): string =>
  `Open a terminal in that folder and run: claude "${prompt}"`;

const openMacTerminal: ClaudeLauncher = async (appPath, prompt) => {
  const shellCommand = claudeTerminalCommand(appPath, prompt);
  const terminalScript = `tell application "Terminal" to do script ${JSON.stringify(shellCommand)}`;
  const terminalLaunch = await runProcess('osascript', ['-e', terminalScript]);
  return terminalLaunch.code === 0;
};

const openWindowsConsole: ClaudeLauncher = async (appPath, prompt) => {
  const consoleLaunch = await runProcess(
    'powershell',
    ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_CLAUDE_WINDOW_SCRIPT],
    {
      env: { ...process.env, VYBEKIIT_APP_PATH: appPath, VYBEKIIT_CLAUDE_PROMPT: prompt },
    },
  );
  return consoleLaunch.code === 0;
};

const CLAUDE_LAUNCHERS: Readonly<Partial<Record<NodeJS.Platform, ClaudeLauncher>>> = {
  darwin: openMacTerminal,
  win32: openWindowsConsole,
};

export const openClaudeWithSeed = async (
  appPath: string,
  prompt: string,
  platform: NodeJS.Platform = process.platform,
): Promise<boolean> => {
  const launchClaude = CLAUDE_LAUNCHERS[platform];
  if (launchClaude === undefined) {
    return false;
  }
  const claudeVersion = await runProcess('claude', ['--version']);
  return claudeVersion.code === 0 && (await launchClaude(appPath, prompt));
};

export const openClaudeInApp = async (
  appPath: string,
  prompt: string,
  interactive: boolean,
): Promise<boolean> => {
  if (!interactive) {
    return await openClaudeWithSeed(appPath, prompt);
  }
  process.stdout.write(`Opening Claude in your app with: "${prompt}"\n\n`);
  const claudeSession = await runProcess('claude', [prompt], { cwd: appPath, stdio: 'inherit' });
  return claudeSession.code === 0;
};
