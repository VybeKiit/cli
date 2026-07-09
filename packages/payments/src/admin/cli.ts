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
 * Reads `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID` (and `LEMONSQUEEZY_WEBHOOK_SECRET`
 * for create/ensure) from the environment — source the repo `.env` first. Secrets are
 * never printed; only the webhook id/url/events/mode are shown.
 */

const write = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing required env var ${name} — source the repo .env first.`);
  }
  return value;
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
): Promise<void> => {
  const url = readFlag(argv, 'url');
  if (url === undefined) {
    throw new Error(`Usage: ${mode} --url <https://.../api/webhook>`);
  }
  const secret = requireEnv('LEMONSQUEEZY_WEBHOOK_SECRET');
  const events = ORDER_WEBHOOK_EVENTS;

  if (mode === 'ensure') {
    const result = await ensureStoreWebhook({ storeId, url, secret, events });
    write(result.created ? 'Created webhook:' : 'Webhook already present:');
    write(formatWebhook(result.webhook));
    return;
  }

  write('Created webhook:');
  write(formatWebhook(await createStoreWebhook({ storeId, url, secret, events })));
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
): Promise<void> => {
  switch (command) {
    case 'list':
      return runList(storeId);
    case 'ensure':
      return runEnsureOrCreate(storeId, rest, 'ensure');
    case 'create':
      return runEnsureOrCreate(storeId, rest, 'create');
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
  const storeId = requireEnv('LEMONSQUEEZY_STORE_ID');
  configureLemonSqueezy(requireEnv('LEMONSQUEEZY_API_KEY'));
  await dispatch(command, storeId, rest);
};

run().catch((error: unknown) => {
  const detail = error instanceof Error ? error.message : String(error);
  process.stderr.write(`ls:webhooks error: ${detail}\n`);
  process.exitCode = 1;
});
