/**
 * Error classes for `@vybekiit/browser-automation` extension domain.
 */

export class CdpUnreachableError extends Error {
  constructor(
    public endpoint: string,
    cause?: unknown,
  ) {
    super(
      `Could not connect to CWS Chrome at ${endpoint}. Start Chrome with the CWS profile ($HOME/.cws-chrome-profile) first.`,
    );
    this.name = 'CdpUnreachableError';
    if (cause) this.cause = cause;
  }
}

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

export class MissingItemIdError extends Error {
  constructor(
    public extensionKey: string,
    public verb: string,
  ) {
    super(
      `Extension "${extensionKey}" has no chromeWebStoreId in .vybekiit/store/extension/cws.json. Run \`vybekiit-automate extension create-new-item --json\` first, or set the ID manually.`,
    );
    this.name = 'MissingItemIdError';
  }
}

export class SelectorMissingError extends Error {
  constructor(
    public fieldKey: string,
    public reason: 'missing' | 'stale',
  ) {
    super(
      `Selector for "${fieldKey}" is ${reason}. Maintainer: run recorder:extension open/apply in @vybekiit/browser-automation.`,
    );
    this.name = 'SelectorMissingError';
  }
}

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
