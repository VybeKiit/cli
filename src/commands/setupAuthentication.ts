import { spawnSync } from 'node:child_process';
import { selectToolchain, type Tool } from '../doctor/toolchain';
import { type SetupPreferences, setupEnvironment } from './setupPreferences';

export type SetupCommandRunner = (
  command: string,
  args: readonly string[],
  interactive: boolean,
) => number;

export type SetupAuthenticationResult = {
  readonly ok: boolean;
  readonly connected: readonly string[];
  readonly needsAttention: readonly string[];
  readonly lines: readonly string[];
};

const defaultSetupCommandRunner: SetupCommandRunner = (command, args, interactive) =>
  spawnSync(command, [...args], { stdio: interactive ? 'inherit' : 'ignore' }).status ?? 1;

const connectTool = (
  tool: Tool,
  run: SetupCommandRunner,
): { readonly connected: boolean; readonly line: string } => {
  if (tool.auth === undefined) {
    return { connected: true, line: `✓ ${tool.name} is ready.` };
  }
  if (run(tool.auth.command, tool.auth.args, false) === 0) {
    return { connected: true, line: `✓ ${tool.name} reused your existing sign-in.` };
  }
  if (tool.auth.signIn === undefined) {
    return {
      connected: false,
      line: `✗ ${tool.name} still needs attention. ${tool.auth.loginHint}`,
    };
  }

  process.stdout.write(`\nOpening the ${tool.name} sign-in flow in your browser…\n`);
  const signInCode = run(tool.auth.signIn.command, tool.auth.signIn.args, true);
  const connected = signInCode === 0 && run(tool.auth.command, tool.auth.args, false) === 0;
  return connected
    ? { connected: true, line: `✓ ${tool.name} sign-in verified.` }
    : {
        connected: false,
        line: `✗ ${tool.name} still needs sign-in. Run: ${tool.auth.loginHint}`,
      };
};

/** Reuse or open the official sign-in flow for each selected service. */
export const connectSetupServices = (
  preferences: SetupPreferences,
  run: SetupCommandRunner = defaultSetupCommandRunner,
): SetupAuthenticationResult => {
  const selectedTools = selectToolchain(setupEnvironment(preferences), {
    wantsGoogleAuth: preferences.googleSignIn,
  });
  const attempts = selectedTools.map((tool) => ({ tool, result: connectTool(tool, run) }));

  return {
    ok: attempts.every(({ result }) => result.connected),
    connected: attempts.filter(({ result }) => result.connected).map(({ tool }) => tool.name),
    needsAttention: attempts.filter(({ result }) => !result.connected).map(({ tool }) => tool.name),
    lines: attempts.map(({ result }) => result.line),
  };
};
