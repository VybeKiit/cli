import { buildVerbContext, discoverStore } from '@vybekiit/browser-automation/cli/discover';
import { printJson, printLine } from '@vybekiit/browser-automation/cli/output';
import type { CommandDef, CommandRegistry } from '@vybekiit/browser-automation/cli/registry';
import { createNewItem } from './verbs/createNewItem';
import { importListing } from './verbs/importListing';
import { publish } from './verbs/publish';
import { readListingState } from './verbs/readListingState';
import { readReviewStatus } from './verbs/readReviewStatus';
import { readVersionHistory } from './verbs/readVersionHistory';
import { readViolations } from './verbs/readViolations';
import { submitForReview } from './verbs/submitForReview';
import { updateListing } from './verbs/updateListing';
import { uploadPackage } from './verbs/uploadPackage';

type ExtensionCliFlags = {
  readonly json: boolean;
};

/**
 * Discover the buyer repo CWS context and run one CLI verb.
 *
 * @param flags - Parsed global CLI flags.
 * @param fn - Verb runner that receives the discovered context.
 * @returns Process exit code for the CLI command.
 * @example
 * const code = await withContext({ json: true }, (ctx) => readListingState(ctx));
 */
const withContext = async (
  flags: ExtensionCliFlags,
  fn: (ctx: ReturnType<typeof buildVerbContext>) => Promise<unknown>,
): Promise<number> => {
  const discovered = await discoverStore();
  const ctx = buildVerbContext(discovered);
  const result = await fn(ctx);
  if (flags.json) {
    printJson({ ok: true, result });
  } else if (result !== undefined && typeof result === 'object') {
    printLine(JSON.stringify(result, null, 2));
  } else if (result !== undefined) {
    printLine(String(result));
  }
  return 0;
};

/**
 * Build CWS listing mutation commands.
 *
 * @returns Commands that import, update, or upload listing package data.
 * @example
 * const commands = listingMutationCommands();
 */
const listingMutationCommands = (): Record<string, CommandDef> => ({
  import: {
    description: 'Import live CWS listing into .vybekiit/store/extension/cws-listing.ts',
    run: async ({ flags }) =>
      withContext(flags, async (ctx) => {
        const { filePath } = await importListing(ctx);
        if (!flags.json) {
          printLine(`OK: wrote ${filePath}`);
        }
        return { filePath };
      }),
  },
  update: {
    description: 'Push cws-listing.ts to the dev console (drift-aware)',
    run: async ({ flags }) =>
      withContext(flags, async (ctx) => {
        const { applied } = await updateListing(ctx);
        if (!flags.json) {
          printLine(
            applied.length === 0 ? 'OK: no changes' : `OK: pushed ${applied.length} field(s)`,
          );
        }
        return { applied };
      }),
  },
  'upload-package': {
    description: 'Build, zip, and upload a package draft',
    run: async ({ flags }) =>
      withContext(flags, async (ctx) => {
        const { packageText, zipPath } = await uploadPackage(ctx);
        if (!flags.json) {
          printLine(`OK: uploaded ${zipPath}`);
          printLine(packageText);
        }
        return { zipPath, packageText };
      }),
  },
});

/**
 * Build CWS release action commands.
 *
 * @returns Commands that publish, submit, or create CWS items.
 * @example
 * const commands = releaseActionCommands();
 */
const releaseActionCommands = (): Record<string, CommandDef> => ({
  publish: {
    description: 'Publish a draft that cleared review',
    run: async ({ flags }) =>
      withContext(flags, async (ctx) => {
        await publish(ctx);
        if (!flags.json) {
          printLine('OK');
        }
        return {};
      }),
  },
  'submit-review': {
    description: 'Submit current draft to Google review queue',
    run: async ({ flags }) =>
      withContext(flags, async (ctx) => {
        await submitForReview(ctx);
        if (!flags.json) {
          printLine('OK');
        }
        return {};
      }),
  },
  'create-new-item': {
    description: 'Mint a new CWS item ID and record it in cws.json',
    run: async ({ flags }) =>
      withContext(flags, async (ctx) => {
        const { chromeWebStoreId } = await createNewItem(ctx);
        if (!flags.json) {
          printLine(`OK: minted ${chromeWebStoreId}`);
        }
        return { chromeWebStoreId };
      }),
  },
});

/**
 * Build read-only CWS inspection commands.
 *
 * @returns Commands that read live CWS state without writing.
 * @example
 * const commands = readOnlyCommands();
 */
const readOnlyCommands = (): Record<string, CommandDef> => ({
  'read-listing-state': {
    description: 'Print live store listing as JSON',
    run: async ({ flags }) => withContext(flags, (ctx) => readListingState(ctx)),
  },
  'read-violations': {
    description: 'Print issues panel as JSON',
    run: async ({ flags }) => withContext(flags, (ctx) => readViolations(ctx)),
  },
  'read-review-status': {
    description: 'Print review status badge',
    run: async ({ flags }) => withContext(flags, (ctx) => readReviewStatus(ctx)),
  },
  'read-version-history': {
    description: 'Print version history table',
    run: async ({ flags }) => withContext(flags, (ctx) => readVersionHistory(ctx)),
  },
});

/**
 * Register Chrome Web Store automation commands.
 *
 * @param registry - CLI command registry to mutate.
 * @returns Nothing; the registry receives the extension domain.
 * @example
 * registerExtensionDomain(registry);
 */
export const registerExtensionDomain = (registry: CommandRegistry): void => {
  registry.register({
    name: 'extension',
    aliases: ['cws'],
    commands: {
      ...listingMutationCommands(),
      ...releaseActionCommands(),
      ...readOnlyCommands(),
    },
  });
};
