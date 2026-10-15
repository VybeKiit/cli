import { Data, Effect, Schema } from 'effect';
import { type ExecFn, MISSING_COMMAND_CODE } from './exec';
import {
  GLOBAL_MCP_SERVERS,
  hasKeys,
  isZeroConfig,
  type McpRegistrationOutcomes,
  type McpServerDef,
} from './installGlobalMcp';

export class CodexListingError extends Data.TaggedError('CodexListingError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const CodexMcpRegistration = Schema.Struct({
  name: Schema.String,
  transport: Schema.Struct({
    command: Schema.optionalWith(Schema.String, { default: () => '' }),
    args: Schema.optionalWith(Schema.Array(Schema.String), { default: () => [] }),
  }),
});

type CodexMcpRegistration = Schema.Schema.Type<typeof CodexMcpRegistration>;

const decodeCodexMcpListing = Schema.decodeUnknown(
  Schema.parseJson(Schema.Array(CodexMcpRegistration)),
);

type CodexMcpOutcome = 'enabled' | 'alreadyPresent' | 'refreshed' | 'needsKey' | 'failed';

type CodexServerOutcome = { readonly name: string; readonly outcome: CodexMcpOutcome };

export type CodexMcpSetup = {
  readonly codex: ExecFn;
  readonly environment: Record<string, string | undefined>;
  readonly forceRefresh: boolean;
};

export type CodexMcpInstallation = McpRegistrationOutcomes & {
  readonly codexMissing: boolean;
};

export const CODEX_MCP_SERVERS = GLOBAL_MCP_SERVERS.filter(
  (mcpServer) => mcpServer.transport === 'stdio',
);

export const codexMcpAddArguments = (
  mcpServer: McpServerDef,
  environment: Record<string, string | undefined>,
): string[] => {
  const envFlags = (mcpServer.envKeys || []).flatMap((key) => [
    '--env',
    `${key}=${environment[key] || ''}`,
  ]);
  return ['mcp', 'add', ...envFlags, mcpServer.name, '--', ...mcpServer.command];
};

export const codexMcpOwner = (
  mcpServer: McpServerDef,
  registrations: readonly CodexMcpRegistration[],
): 'absent' | 'vybekiit' | 'user' => {
  const registration = registrations.find((registered) => registered.name === mcpServer.name);
  if (registration === undefined) {
    return 'absent';
  }
  const registeredCommand = [registration.transport.command, ...registration.transport.args].join(
    ' ',
  );
  const vybekiitRegistration =
    mcpServer.name === 'vybekiit' || registeredCommand === mcpServer.command.join(' ');
  return vybekiitRegistration ? 'vybekiit' : 'user';
};

export const codexInstalled = (codex: ExecFn) =>
  Effect.promise(() => codex(['--version'])).pipe(
    Effect.map((codexVersion) => codexVersion.code !== MISSING_COMMAND_CODE),
  );

export const listCodexMcpRegistrations = (codex: ExecFn) =>
  Effect.promise(() => codex(['mcp', 'list', '--json'])).pipe(
    Effect.filterOrFail(
      (codexListing) => codexListing.code === 0,
      (codexListing) =>
        new CodexListingError({
          message: `Codex could not list its tool connections. ${codexListing.stderr.trim()}`,
        }),
    ),
    Effect.flatMap((codexListing) =>
      decodeCodexMcpListing(codexListing.stdout).pipe(
        Effect.mapError(
          (cause) =>
            new CodexListingError({
              message: 'Codex listed its tool connections in a shape VybeKiit does not know.',
              cause,
            }),
        ),
      ),
    ),
  );

const codexServerOutcome = (
  codexSetup: CodexMcpSetup,
  mcpServer: McpServerDef,
  registrations: readonly CodexMcpRegistration[],
) => {
  if (!hasKeys(mcpServer, codexSetup.environment)) {
    return Effect.succeed<CodexServerOutcome>({ name: mcpServer.name, outcome: 'needsKey' });
  }
  const registered = codexMcpOwner(mcpServer, registrations) !== 'absent';
  const refreshDue = registered && codexSetup.forceRefresh && isZeroConfig(mcpServer);
  if (registered && !refreshDue) {
    return Effect.succeed<CodexServerOutcome>({ name: mcpServer.name, outcome: 'alreadyPresent' });
  }
  const addedOutcome = refreshDue ? 'refreshed' : 'enabled';
  const addArguments = codexMcpAddArguments(mcpServer, codexSetup.environment);
  return Effect.promise(() => codexSetup.codex(addArguments)).pipe(
    Effect.map(
      (codexAdd): CodexServerOutcome => ({
        name: mcpServer.name,
        outcome: codexAdd.code === 0 ? addedOutcome : 'failed',
      }),
    ),
  );
};

const serverNamesWith = (serverOutcomes: readonly CodexServerOutcome[], outcome: CodexMcpOutcome) =>
  serverOutcomes
    .filter((serverOutcome) => serverOutcome.outcome === outcome)
    .map((serverOutcome) => serverOutcome.name);

const codexInstallation = (
  serverOutcomes: readonly CodexServerOutcome[],
  codexMissing: boolean,
): CodexMcpInstallation => ({
  enabled: serverNamesWith(serverOutcomes, 'enabled'),
  alreadyPresent: serverNamesWith(serverOutcomes, 'alreadyPresent'),
  refreshed: serverNamesWith(serverOutcomes, 'refreshed'),
  needsKey: serverNamesWith(serverOutcomes, 'needsKey'),
  failed: serverNamesWith(serverOutcomes, 'failed'),
  codexMissing,
});

export const installCodexMcp = (codexSetup: CodexMcpSetup) =>
  Effect.gen(function* () {
    if (!(yield* codexInstalled(codexSetup.codex))) {
      return codexInstallation([], true);
    }
    const unlistedOutcomes = CODEX_MCP_SERVERS.map(
      (mcpServer): CodexServerOutcome => ({
        name: mcpServer.name,
        outcome: hasKeys(mcpServer, codexSetup.environment) ? 'failed' : 'needsKey',
      }),
    );
    const serverOutcomes = yield* listCodexMcpRegistrations(codexSetup.codex).pipe(
      Effect.flatMap((registrations) =>
        Effect.all(
          CODEX_MCP_SERVERS.map((mcpServer) =>
            codexServerOutcome(codexSetup, mcpServer, registrations),
          ),
          { concurrency: 1 },
        ),
      ),
      Effect.catchTag('CodexListingError', () => Effect.succeed(unlistedOutcomes)),
    );
    return codexInstallation(serverOutcomes, false);
  });
