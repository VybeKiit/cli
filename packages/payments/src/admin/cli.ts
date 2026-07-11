import { resolveLemonSqueezyEnv } from '../config';
import {
  configureLemonSqueezy,
  createStoreWebhook,
  deleteStoreWebhook,
  ensureStoreWebhook,
  listStoreWebhooks,
  ORDER_WEBHOOK_EVENTS,
  type StoreWebhook,
} from './webhooks';

/**
 * Ops CLI for the VybeKiit store's own Lemon Squeezy webhooks (list / ensure / create /
 * delete), backed by {@link ./webhooks}. Not shipped to buyers (excluded from the build) —
 * run with tsx: `pnpm --filter @vybekiit/payments ls:webhooks <command>`.
 *
 * Reads store credentials via {@link resolveLemonSqueezyEnv} so
 * `LEMONSQUEEZY_TEST_MODE=true` + `LEMONSQUEEZY_TEST_MODE_*` prefer the test key/secret
 * and leave live `LEMONSQUEEZY_API_KEY` / `LEMONSQUEEZY_WEBHOOK_SECRET` alone. Source the
 * repo `.env` first. Secrets are never printed; only id/url/events/mode are shown.
 */

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const readFlag = (argv: readonly string[], name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 ? argv[index + 1] : undefined;
};

const formatWebhook = (webhook: StoreWebhook): string =>
  `  #${webhook.id}  ${webhook.url}  [${webhook.events.join(', ')}]  test_mode=${webhook.testMode}`;

const runList = async (storeId: string): Promise<void> => {
  const webhooks = await listStoreWebhooks(storeId);
  write(`${webhooks.length} webhook(s) on store ${storeId}:`);
  for (const webhook of webhooks) {
    write(formatWebhook(webhook));
  }
};

const runEnsureOrCreate = async (
  storeId: string,
  argv: readonly string[],
  mode: 'ensure' | 'create',
  secret: string,
  testMode: boolean,
): Promise<void> => {
  const url = readFlag(argv, 'url');
  if (url === undefined) {
    throw new Error(`Usage: ${mode} --url <https://.../api/webhook>`);
  }
  if (secret.length === 0) {
    throw new Error(
      testMode
        ? 'Missing LEMONSQUEEZY_TEST_MODE_WEBHOOK_SECRET (required when LEMONSQUEEZY_TEST_MODE=true with a test API key).'
        : 'Missing LEMONSQUEEZY_WEBHOOK_SECRET — source the repo .env first.',
    );
  }
  const events = ORDER_WEBHOOK_EVENTS;

  if (mode === 'ensure') {
    const result = await ensureStoreWebhook({ storeId, url, secret, events, testMode });
    write(result.created ? 'Created webhook:' : 'Webhook already present:');
    write(formatWebhook(result.webhook));
    return;
  }

  write('Created webhook:');
  write(formatWebhook(await createStoreWebhook({ storeId, url, secret, events, testMode })));
};

const runDelete = async (argv: readonly string[]): Promise<void> => {
  const [id] = argv;
  if (id === undefined) {
    throw new Error('Usage: delete <webhookId>');
  }
  await deleteStoreWebhook(id);
  write(`Deleted webhook #${id}.`);
};

const dispatch = (
  command: string | undefined,
  storeId: string,
  rest: readonly string[],
  secret: string,
  testMode: boolean,
): Promise<void> => {
  switch (command) {
    case 'list':
      return runList(storeId);
    case 'ensure':
      return runEnsureOrCreate(storeId, rest, 'ensure', secret, testMode);
    case 'create':
      return runEnsureOrCreate(storeId, rest, 'create', secret, testMode);
    case 'delete':
      return runDelete(rest);
    default:
      return Promise.reject(
        new Error(
          `Unknown command "${command ?? ''}". Use: list | ensure --url <> | create --url <> | delete <id>`,
        ),
      );
  }
};

const run = async (): Promise<void> => {
  const [, , command, ...rest] = process.argv;
  const resolved = resolveLemonSqueezyEnv(process.env);
  const storeId = resolved.LEMONSQUEEZY_STORE_ID;
  const apiKey = resolved.LEMONSQUEEZY_API_KEY;
  if (storeId === undefined || storeId.length === 0) {
    throw new Error('Missing required env var LEMONSQUEEZY_STORE_ID — source the repo .env first.');
  }
  if (apiKey === undefined || apiKey.length === 0) {
    throw new Error(
      'Missing Lemon Squeezy API key — set LEMONSQUEEZY_API_KEY (live) or LEMONSQUEEZY_TEST_MODE_API_KEY when LEMONSQUEEZY_TEST_MODE=true.',
    );
  }
  const secret = resolved.LEMONSQUEEZY_WEBHOOK_SECRET ?? '';
  const testMode = resolved.LEMONSQUEEZY_TEST_MODE === 'true';
  configureLemonSqueezy(apiKey);
  write(`Using ${testMode ? 'TEST' : 'LIVE'} Lemon Squeezy credentials (secrets never printed).`);
  await dispatch(command, storeId, rest, secret, testMode);
};

run().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  process.stderr.write(`ls:webhooks error: ${detail}\n`);
  process.exitCode = 1;
});
