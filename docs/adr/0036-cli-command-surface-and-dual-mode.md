# ADR-0036: CLI command surface and dual-mode contract

## Status

Accepted.

## Context

The `vybekiit` CLI is the only public artifact (ADR-0033) and the surface both humans and agents
drive. ADR-0034 §10 kept it lightweight (a local parser + typed command registry, `@clack/prompts`
behind a boundary, structured `CommandResult` cores). What was never written down as a rule is the
*shape* of the surface — how verbs register, and the contract that a bare invocation must open a menu
while a flagged or non-interactive invocation must defer and never hang. Agents call the CLI with
flags in CI; humans call the same commands by menu. Without a recorded contract, a new command could
add a second code path or a prompt that blocks a non-TTY run.

## Decision

1. **Verbs register in one map.** Every top-level command is a key in the `COMMAND_HANDLERS` record in
   `cli/src/cliRunner.ts`; kebab-case names (`sync-agent-layer`, `apply-preset`). Sub-nouns dispatch
   inside their handler (`scaffold backend`, `add bridge`). The map is the SSOT for the surface.
2. **Dual-mode is a contract.** A bare invocation in a TTY opens a `@clack/prompts` menu; flags or a
   non-TTY invocation defer to the same handler functions and **never hang** — they print what is
   needed and exit non-zero. The gate is `isInteractive()` (`cli/src/prompts/tty.ts`); both routes
   call the same functions, so there is never a second implementation to drift.
3. **Prompts stay behind `@clack/prompts`** and handle `isCancel()`; `@inquirer/prompts` is banned via
   `noRestrictedImports` (ADR-0034). Flags accept both `--flag=value` and `--flag value`.
4. **No `console`.** CLI output is written through `process.stdout`/`process.stderr`; command cores
   return a structured result the entrypoint renders once (human text or JSON).

## Consequences

- Adding a command is a `COMMAND_HANDLERS` entry plus a handler that honours the dual-mode gate — the
  `CODE-STYLE.md` "CLI" section and the "add a package" recipe reference this ADR.
- CI can drive any command headlessly with flags, and a missing flag produces a clear error instead of
  a hung prompt.
- This extends ADR-0034 §10 (lightweight CLI) and ADR-0011 (interactive front door); it does not
  reopen the parser-dependency question.
