export class CdpUnreachableError extends Error {
  constructor(
    public endpoint: string,
    public profileHint: string,
    cause?: unknown,
  ) {
    super(`Could not connect to Chrome at ${endpoint}. Start Chrome with profile (${profileHint}) first.`);
    this.name = 'CdpUnreachableError';
    if (cause) this.cause = cause;
  }
}

export class DestructiveClickRefusedError extends Error {
  constructor(
    public accessibleName: string,
    public verb: string,
  ) {
    super(`Refused to click "${accessibleName}" while running "${verb}".`);
    this.name = 'DestructiveClickRefusedError';
  }
}

export class SelectorMissingError extends Error {
  constructor(
    public fieldKey: string,
    public reason: 'missing' | 'stale',
  ) {
    super(`Selector for "${fieldKey}" is ${reason}. Run the maintainer recorder to update selectors.`);
    this.name = 'SelectorMissingError';
  }
}
