// biome-ignore lint/style/noExcessiveClassesPerFile: related automation errors share this small import surface.
export class CdpUnreachableError extends Error {
  readonly endpoint: string;
  readonly profileHint: string;

  constructor(endpoint: string, profileHint: string, options?: { readonly cause?: unknown }) {
    super(
      `Could not connect to Chrome at ${endpoint}. Start Chrome with profile (${profileHint}) first.`,
      options?.cause === undefined ? undefined : { cause: options.cause },
    );
    this.endpoint = endpoint;
    this.profileHint = profileHint;
    this.name = 'CdpUnreachableError';
  }
}

export class DestructiveClickRefusedError extends Error {
  readonly accessibleName: string;
  readonly verb: string;

  constructor(accessibleName: string, verb: string) {
    super(`Refused to click "${accessibleName}" while running "${verb}".`);
    this.accessibleName = accessibleName;
    this.verb = verb;
    this.name = 'DestructiveClickRefusedError';
  }
}

export class SelectorMissingError extends Error {
  readonly fieldKey: string;
  readonly reason: 'missing' | 'stale';

  constructor(fieldKey: string, reason: 'missing' | 'stale') {
    super(
      `Selector for "${fieldKey}" is ${reason}. Run the maintainer recorder to update selectors.`,
    );
    this.fieldKey = fieldKey;
    this.reason = reason;
    this.name = 'SelectorMissingError';
  }
}
