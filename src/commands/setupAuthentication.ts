import { isSignedIn, selectToolchain, type Tool } from '../doctor/toolchain';
import { type ExecResult, runProcess } from '../global/exec';
import { canOpenDesktopBrowser } from '../global/runSessionOne';
import { isInteractive } from '../prompts/tty';
import { type SetupPreferences, setupEnvironment } from './setupPreferences';

export type SetupCommandRunner = (
  command: string,
  args: readonly string[],
  interactive: boolean,
) => Promise<ExecResult>;

export type SetupAuthenticationResult = {
  readonly ok: boolean;
  readonly connected: readonly string[];
  readonly needsAttention: readonly string[];
  readonly lines: readonly string[];
};

export type SetupMachine = {
  readonly canOpenBrowser: () => boolean;
  readonly hasTerminal: () => boolean;
};

const DESKTOP_MACHINE: SetupMachine = {
  canOpenBrowser: canOpenDesktopBrowser,
  hasTerminal: isInteractive,
};

type ToolConnection = {
  readonly status: 'connected' | 'later' | 'needsSignIn';
  readonly line: string;
};

const AUTH_PROBE_TIMEOUT_MILLISECONDS = 60_000;

const defaultSetupCommandRunner: SetupCommandRunner = (command, args, interactive) =>
  runProcess(
    command,
    args,
    interactive ? { stdio: 'inherit' } : { timeout: AUTH_PROBE_TIMEOUT_MILLISECONDS },
  );

const needsSignIn = (tool: Tool, loginHint: string): ToolConnection => ({
  status: 'needsSignIn',
  line: `✗ ${tool.name} needs sign-in. Run: ${loginHint}`,
});

const connectTool = async (
  tool: Tool,
  run: SetupCommandRunner,
  machine: SetupMachine,
): Promise<ToolConnection> => {
  const { auth } = tool;
  if (auth === undefined) {
    return { status: 'connected', line: `✓ ${tool.name} is ready.` };
  }
  const existingSignIn = await run(auth.command, auth.args, false);
  if (isSignedIn(auth, existingSignIn)) {
    return { status: 'connected', line: `✓ ${tool.name} reused your existing sign-in.` };
  }
  const signInWaitsForTerminal = auth.signIn?.needsTerminal === true && !machine.hasTerminal();
  if (signInWaitsForTerminal) {
    return {
      status: 'later',
      line: `→ ${tool.name} sign-in waits until your app needs it, because it asks for a code typed in a terminal. Then run: ${auth.loginHint}`,
    };
  }
  if (auth.signIn === undefined || !machine.canOpenBrowser()) {
    return needsSignIn(tool, auth.loginHint);
  }

  process.stdout.write(`\nOpening the ${tool.name} sign-in page in your browser...\n`);
  const signIn = await run(auth.signIn.command, auth.signIn.args, true);
  if (signIn.code !== 0) {
    return needsSignIn(tool, auth.loginHint);
  }
  const verifiedSignIn = await run(auth.command, auth.args, false);
  return isSignedIn(auth, verifiedSignIn)
    ? { status: 'connected', line: `✓ ${tool.name} sign-in verified.` }
    : needsSignIn(tool, auth.loginHint);
};

/** Reuse or open the official sign-in flow for each selected service. */
export const connectSetupServices = async (
  preferences: SetupPreferences,
  withoutGithub: boolean,
  run: SetupCommandRunner = defaultSetupCommandRunner,
  machine: SetupMachine = DESKTOP_MACHINE,
): Promise<SetupAuthenticationResult> => {
  const selectedTools = selectToolchain(setupEnvironment(preferences), {
    wantsGoogleAuth: preferences.googleSignIn,
    withoutGithub,
  });
  const attempts = await selectedTools.reduce<
    Promise<{ readonly tool: Tool; readonly connection: ToolConnection }[]>
  >(async (earlierAttempts, tool) => {
    const finishedAttempts = await earlierAttempts;
    const connection = await connectTool(tool, run, machine);
    return [...finishedAttempts, { tool, connection }];
  }, Promise.resolve([]));

  return {
    ok: attempts.every(({ connection }) => connection.status !== 'needsSignIn'),
    connected: attempts
      .filter(({ connection }) => connection.status === 'connected')
      .map(({ tool }) => tool.name),
    needsAttention: attempts
      .filter(({ connection }) => connection.status === 'needsSignIn')
      .map(({ tool }) => tool.name),
    lines: attempts.map(({ connection }) => connection.line),
  };
};
