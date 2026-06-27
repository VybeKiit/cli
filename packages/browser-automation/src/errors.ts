/**
 * Error classes for `@vybekiit/browser-automation`. All verbs throw one of these on
 * failure so callers (CLI, agents) can switch on `instanceof` without parsing
 * messages.
 *
 * Why typed errors instead of just `throw new Error(...)`: every verb is also
 * a public surface for coding agents (Claude, Codex). Typed errors give the
 * agent something stable to reason about — e.g. "if I see DriftDetected,
 * re-import; if I see VerifyGateFailed, surface the failing command".
 */

/**
 * The CDP endpoint isn't reachable. Almost always means Chrome wasn't
 * started through `pnpm cws launch-chrome` (see ADR-0011 and the package
 * README).
 */
export class CdpUnreachableError extends Error {
  constructor(
    public endpoint: string,
    cause?: unknown,
  ) {
    super(
      `Could not connect to CWS Chrome at ${endpoint}. Run \`pnpm cws launch-chrome\` first (see packages/cws-automation/README.md).`,
    );
    this.name = 'CdpUnreachableError';
    if (cause) this.cause = cause;
  }
}

/**
 * `safeClick` matched an element whose accessible name reads as destructive.
 * The click is refused; the verb that resolved to it is buggy or the page
 * state is unexpected. Callers should treat this as a hard stop, never a
 * retry condition.
 */
export class DestructiveClickRefusedError extends Error {
  constructor(
    public accessibleName: string,
    public verb: string,
  ) {
    super(
      `Refused to click element with accessible name "${accessibleName}" while running verb "${verb}". The destructive-name guard treats this as a hard stop. Inspect the page state and the verb's selector resolution before retrying.`,
    );
    this.name = 'DestructiveClickRefusedError';
  }
}

/**
 * The live CWS state has fields that disagree with `cws-listing.ts`. The
 * push is aborted before any write happens. Caller's options: re-run
 * `importListing` to overwrite the file with current CWS state, or amend
 * the file by hand to acknowledge the drift, then re-push.
 */
export class DriftDetectedError extends Error {
  constructor(
    public diff: string,
    public extensionKey: string,
  ) {
    super(
      `Drift detected for ${extensionKey}: live CWS state differs from cws-listing.ts. Re-import or reconcile by hand before pushing.\n\n${diff}`,
    );
    this.name = 'DriftDetectedError';
  }
}

/**
 * The verb resolved a unique CWS Item ID is required but the
 * `ExtensionConfig.chromeWebStoreId` was empty. Only `createNewItem` is
 * allowed to operate on an empty ID; everything else hits this.
 */
export class MissingItemIdError extends Error {
  constructor(
    public extensionKey: string,
    public verb: string,
  ) {
    super(
      `Extension "${extensionKey}" has no chromeWebStoreId set in cws.json. Run \`pnpm cws create-new-item ${extensionKey}\` first, or set the ID by hand if the item already exists on CWS.`,
    );
    this.name = 'MissingItemIdError';
  }
}

/**
 * A field's selector inventory has no entry, or the entry is older than the
 * staleness threshold. Run the recorder to refresh. Verbs fail closed on
 * missing/stale selectors rather than guessing.
 */
export class SelectorMissingError extends Error {
  constructor(
    public fieldKey: string,
    public reason: 'missing' | 'stale',
  ) {
    super(
      `Selector for "${fieldKey}" is ${reason}. Run \`pnpm cws open-recorder <extension>\` to capture locators against the live dev console, then \`pnpm cws apply-recorded-selectors <extension>\` to write them into src/selectors.generated.ts.`,
    );
    this.name = 'SelectorMissingError';
  }
}

/**
 * `pnpm verify:release` (or its per-extension equivalent) failed. The push
 * is aborted before any CWS write. The exit code and last command output are
 * carried so the caller can show them.
 */
export class VerifyGateFailedError extends Error {
  constructor(
    public failingCommand: string,
    public exitCode: number,
  ) {
    super(
      `Verify gate failed (\`${failingCommand}\` exited with ${exitCode}). Fix the failure and retry. The push has not happened.`,
    );
    this.name = 'VerifyGateFailedError';
  }
}
