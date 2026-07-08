/**
 * Error classes for `@vybekiit/browser-automation` extension domain.
 */

// biome-ignore lint/style/noExcessiveClassesPerFile: extension errors are tiny and share one domain import surface.
export class CdpUnreachableError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, options?: { readonly cause?: unknown }) {
    super(
      `Could not connect to CWS Chrome at ${endpoint}. Start Chrome with the CWS profile ($HOME/.cws-chrome-profile) first.`,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.endpoint = endpoint;
    this.name = 'CdpUnreachableError';
  }
}

export class DestructiveClickRefusedError extends Error {
  readonly accessibleName: string;
  readonly verb: string;

  constructor(accessibleName: string, verb: string) {
    super(
      `Refused to click element with accessible name "${accessibleName}" while running verb "${verb}". The destructive-name guard treats this as a hard stop. Inspect the page state and the verb's selector resolution before retrying.`,
    );
    this.accessibleName = accessibleName;
    this.verb = verb;
    this.name = 'DestructiveClickRefusedError';
  }
}

export class DriftDetectedError extends Error {
  readonly diff: string;
  readonly extensionKey: string;

  constructor(diff: string, extensionKey: string) {
    super(
      `Drift detected for ${extensionKey}: live CWS state differs from cws-listing.ts. Re-import or reconcile by hand before pushing.\n\n${diff}`,
    );
    this.diff = diff;
    this.extensionKey = extensionKey;
    this.name = 'DriftDetectedError';
  }
}

export class MissingItemIdError extends Error {
  readonly extensionKey: string;
  readonly verb: string;

  constructor(extensionKey: string, verb: string) {
    super(
      `Extension "${extensionKey}" has no chromeWebStoreId in .vybekiit/store/extension/cws.json. Run \`vybekiit-automate extension create-new-item --json\` first, or set the ID manually.`,
    );
    this.extensionKey = extensionKey;
    this.verb = verb;
    // biome-ignore lint/security/noSecrets: class name is not a secret.
    this.name = 'MissingItemIdError';
  }
}

export class SelectorMissingError extends Error {
  readonly fieldKey: string;
  readonly reason: 'missing' | 'stale';

  constructor(fieldKey: string, reason: 'missing' | 'stale') {
    super(
      `Selector for "${fieldKey}" is ${reason}. Maintainer: run recorder:extension open/apply in @vybekiit/browser-automation.`,
    );
    this.fieldKey = fieldKey;
    this.reason = reason;
    this.name = 'SelectorMissingError';
  }
}

export class VerifyGateFailedError extends Error {
  readonly exitCode: number;
  readonly failingCommand: string;

  constructor(failingCommand: string, exitCode: number) {
    super(
      `Verify gate failed (\`${failingCommand}\` exited with ${exitCode}). Fix the failure and retry. The push has not happened.`,
    );
    this.failingCommand = failingCommand;
    this.exitCode = exitCode;
    this.name = 'VerifyGateFailedError';
  }
}
