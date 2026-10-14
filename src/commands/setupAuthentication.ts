import { isSignedIn, selectToolchain, type Tool } from '../doctor/toolchain';
import { type ExecResult, runProcess } from '../global/exec';
import { canOpenDesktopBrowser } from '../global/runSessionOne';
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

type ToolConnection = { readonly connected: boolean; readonly line: string };

const AUTH_PROBE_TIMEOUT_MILLISECONDS = 60_000;

const defaultSetupCommandRunner: SetupCommandRunner = (command, args, interactive) =>
  runProcess(
    command,
    args,
    interactive ? { stdio: 'inherit' } : { timeout: AUTH_PROBE_TIMEOUT_MILLISECONDS },
  );

const needsSignIn = (tool: Tool, loginHint: string): ToolConnection => ({
  connected: false,
  line: `✗ ${tool.name} needs sign-in. Run: ${loginHint}`,
});

const connectTool = async (
  tool: Tool,
  run: SetupCommandRunner,
  canOpenBrowser: () => boolean,
): Promise<ToolConnection> => {
  const { auth } = tool;
  if (auth === undefined) {
    return { connected: true, line: `✓ ${tool.name} is ready.` };
  }
  const existingSignIn = await run(auth.command, auth.args, false);
  if (isSignedIn(auth, existingSignIn)) {
    return { connected: true, line: `✓ ${tool.name} reused your existing sign-in.` };
  }
  if (auth.signIn === undefined || !canOpenBrowser()) {
    return needsSignIn(tool, auth.loginHint);
  }

  process.stdout.write(`\nOpening the ${tool.name} sign-in page in your browser...\n`);
  const signIn = await run(auth.signIn.command, auth.signIn.args, true);
  if (signIn.code !== 0) {
    return needsSignIn(tool, auth.loginHint);
  }
  const verifiedSignIn = await run(auth.command, auth.args, false);
  return isSignedIn(auth, verifiedSignIn)
    ? { connected: true, line: `✓ ${tool.name} sign-in verified.` }
    : needsSignIn(tool, auth.loginHint);
};

/** Reuse or open the official sign-in flow for each selected service. */
export const connectSetupServices = async (
  preferences: SetupPreferences,
  withoutGithub: boolean,
  run: SetupCommandRunner = defaultSetupCommandRunner,
  canOpenBrowser: () => boolean = canOpenDesktopBrowser,
): Promise<SetupAuthenticationResult> => {
  const selectedTools = selectToolchain(setupEnvironment(preferences), {
    wantsGoogleAuth: preferences.googleSignIn,
    withoutGithub,
  });
  const attempts = await selectedTools.reduce<
    Promise<{ readonly tool: Tool; readonly connection: ToolConnection }[]>
  >(async (earlierAttempts, tool) => {
    const finishedAttempts = await earlierAttempts;
    const connection = await connectTool(tool, run, canOpenBrowser);
    return [...finishedAttempts, { tool, connection }];
  }, Promise.resolve([]));

  return {
    ok: attempts.every(({ connection }) => connection.connected),
    connected: attempts
      .filter(({ connection }) => connection.connected)
      .map(({ tool }) => tool.name),
    needsAttention: attempts
      .filter(({ connection }) => !connection.connected)
      .map(({ tool }) => tool.name),
    lines: attempts.map(({ connection }) => connection.line),
  };
};
