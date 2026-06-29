import { buildVerbContext, discoverStore } from '../../cli/discover';
import type { CommandRegistry } from '../../cli/registry';
import { printJson } from '../../cli/output';
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

async function withContext(
  flags: { json: boolean },
  fn: (ctx: ReturnType<typeof buildVerbContext>) => Promise<unknown>,
): Promise<number> {
  const discovered = await discoverStore();
  const ctx = buildVerbContext(discovered);
  const result = await fn(ctx);
  if (flags.json) printJson({ ok: true, result });
  else if (result !== undefined && typeof result === 'object') {
    console.log(JSON.stringify(result, null, 2));
  } else if (result !== undefined) {
    console.log(String(result));
  }
  return 0;
}

export function registerExtensionDomain(registry: CommandRegistry): void {
  registry.register({
    name: 'extension',
    aliases: ['cws'],
    commands: {
      import: {
        description: 'Import live CWS listing into .vybekiit/store/extension/cws-listing.ts',
        run: async ({ flags }) =>
          withContext(flags, async (ctx) => {
            const { filePath } = await importListing(ctx);
            if (!flags.json) console.log(`OK: wrote ${filePath}`);
            return { filePath };
          }),
      },
      update: {
        description: 'Push cws-listing.ts to the dev console (drift-aware)',
        run: async ({ flags }) =>
          withContext(flags, async (ctx) => {
            const { applied } = await updateListing(ctx);
            if (!flags.json) {
              console.log(applied.length === 0 ? 'OK: no changes' : `OK: pushed ${applied.length} field(s)`);
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
              console.log(`OK: uploaded ${zipPath}`);
              console.log(packageText);
            }
            return { zipPath, packageText };
          }),
      },
      publish: {
        description: 'Publish a draft that cleared review',
        run: async ({ flags }) =>
          withContext(flags, async (ctx) => {
            await publish(ctx);
            if (!flags.json) console.log('OK');
            return {};
          }),
      },
      'submit-review': {
        description: 'Submit current draft to Google review queue',
        run: async ({ flags }) =>
          withContext(flags, async (ctx) => {
            await submitForReview(ctx);
            if (!flags.json) console.log('OK');
            return {};
          }),
      },
      'create-new-item': {
        description: 'Mint a new CWS item ID and record it in cws.json',
        run: async ({ flags }) =>
          withContext(flags, async (ctx) => {
            const { chromeWebStoreId } = await createNewItem(ctx);
            if (!flags.json) console.log(`OK: minted ${chromeWebStoreId}`);
            return { chromeWebStoreId };
          }),
      },
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
    },
  });
}
