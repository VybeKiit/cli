import type { CatalogEntry, UnavailableReason } from '@library/data/catalog';

/** Short chip copy for catalog cards. */
export const UNAVAILABLE_CHIP: Readonly<Record<UnavailableReason, string>> = {
  env: 'Needs API key',
  deps: 'Needs deps',
  native: 'Native only',
  nodemo: 'No preview',
};

/** Buyer-facing detail copy when a component cannot render live. */
export const UNAVAILABLE_COPY: Readonly<Record<UnavailableReason, string>> = {
  env: 'This example needs API keys or a live backend. Import it into your app to run it there.',
  deps: 'This component needs extra packages the starter does not install by default. Copy the source above and ask your agent to add its dependencies.',
  native:
    'This is a native or WebGL component. It renders inside your app, not in the isolated gallery preview.',
  nodemo: 'Live preview is coming soon. The source above is ready to copy into your app.',
};

/** Short embed fallback when a non-previewable entry is opened. */
export const EMBED_UNAVAILABLE: Readonly<Record<UnavailableReason, string>> = {
  env: 'Needs API keys or a live backend — run it inside your app.',
  deps: 'Needs extra packages the starter does not install by default.',
  native: 'Native/WebGL component — renders in your app, not the gallery.',
  nodemo: 'Live preview is coming soon.',
};

/**
 * Resolve why a catalog entry is not previewable.
 *
 * @param entry - Catalog entry under inspection.
 * @returns Explicit reason, or a fallback derived from `requiresEnv`.
 * @example
 * unavailableReasonOf(entry); // "env" | "deps" | "native" | "nodemo"
 */
export const unavailableReasonOf = (entry: CatalogEntry): UnavailableReason => {
  if (entry.unavailableReason !== undefined) {
    return entry.unavailableReason;
  }
  return entry.requiresEnv ? 'env' : 'nodemo';
};
