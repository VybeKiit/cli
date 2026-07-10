import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';
import { neon } from '@neondatabase/serverless';
import type { SqlClient } from '@vybekiit/db/providers/postgres/hybridProvider';
import { DbError } from '@vybekiit/db/types';
import { Effect } from 'effect';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MongoClient } from 'mongodb';
import { getPreset } from './catalog';
import {
  buildAwsApplyPlan,
  buildFirebaseApplyPlan,
  buildMongoApplyPlan,
  type DynamoTablePlan,
  type MongoCollectionPlan,
  renderNosqlPreset,
  renderPreset,
} from './render';
import type { NosqlProviderName, PostgresProviderName, PresetManifest } from './types';

/**
 * Narrow an unknown caught value to a developer-facing message.
 *
 * @param error - Unknown caught value.
 * @returns Error message for a failed DbError.
 * @example
 * const message = errorMessage(error);
 */
const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Build a stable preset failure for agents and CLI output.
 *
 * @param code - Stable preset failure code.
 * @param message - Developer-facing failure message.
 * @returns Effect that fails with DbError.
 * @example
 * const effect = failPreset('not_found', 'Unknown preset.');
 */
const failPreset = (code: string, message: string): Effect.Effect<never, DbError> =>
  Effect.fail(new DbError({ code, message }));

type MigrationSqlClient = SqlClient;

// "a;\n\nb;" -> ["a;", "b;"]
const SQL_BLOCK_SEPARATOR = /\n\n+/;

// "-- note" -> match, "select 1" -> no match
const SQL_COMMENT_ONLY_BLOCK = /^--[^\n]*$/;

/**
 * Whether a provider name targets a NoSQL backend.
 *
 * @param provider - Provider from apply options.
 * @returns True for mongodb, firebase, or aws.
 * @example
 * const nosql = isNosqlProvider('mongodb');
 */
const isNosqlProvider = (
  provider: PostgresProviderName | NosqlProviderName,
): provider is NosqlProviderName =>
  provider === 'mongodb' || provider === 'firebase' || provider === 'aws';

/**
 * Execute a rendered SQL migration as blank-line-delimited blocks.
 *
 * @param sql - SQL client capable of executing a string statement.
 * @param migrationSql - Rendered migration SQL.
 * @returns A Promise that resolves after all blocks execute.
 * @example
 * await executeMigration(sql, renderPresetSql(manifest, 'supabase'));
 */
const executeMigration = async (sql: MigrationSqlClient, migrationSql: string): Promise<void> => {
  const blocks = migrationSql
    .split(SQL_BLOCK_SEPARATOR)
    .map((block) => block.trim())
    .filter((block) => block.length > 0 && !block.match(SQL_COMMENT_ONLY_BLOCK));
  for (const block of blocks) {
    // biome-ignore lint/performance/noAwaitInLoops: Migration statements must run in rendered order.
    await sql(block);
  }
};

/** Options for applying one preset migration. */
export type ApplyPresetOptions = {
  readonly presetId: string;
  readonly provider: PostgresProviderName | NosqlProviderName;
  readonly databaseUrl: string;
  readonly dryRun?: boolean;
};

/** Result payload for an applied or dry-run preset migration. */
export type ApplyPresetResult = {
  readonly presetId: string;
  readonly provider: PostgresProviderName | NosqlProviderName;
  readonly sql?: string;
  readonly nosqlNotes?: string;
  readonly applied: boolean;
};

/**
 * Resolve the MongoDB database name from the environment.
 *
 * @returns Configured name, or the kit default `vybekiit`.
 * @example
 * const dbName = resolveMongoDbName();
 */
const resolveMongoDbName = (): string => {
  const fromEnv = process.env.MONGODB_DB;
  if (fromEnv !== undefined && fromEnv !== '') {
    return fromEnv;
  }
  return 'vybekiit';
};

/**
 * Ensure MongoDB collections exist and create planned indexes.
 *
 * @param collections - Collection plans from the Mongo apply plan.
 * @param databaseUrl - Mongo connection URI (DATABASE_URL or MONGODB_URI).
 * @returns Promise that resolves when apply finishes.
 * @example
 * await applyMongoCollections(plan.collections, uri);
 */
const applyMongoCollections = async (
  collections: readonly MongoCollectionPlan[],
  databaseUrl: string,
): Promise<void> => {
  const client = new MongoClient(databaseUrl);
  try {
    await client.connect();
    const db = client.db(resolveMongoDbName());
    const existing = await db.listCollections({}, { nameOnly: true }).toArray();
    const existingNames = new Set(existing.map((entry) => entry.name));

    for (const collection of collections) {
      if (!existingNames.has(collection.name)) {
        // biome-ignore lint/performance/noAwaitInLoops: Collections must exist before indexes.
        await db.createCollection(collection.name);
      }
      const coll = db.collection(collection.name);
      for (const index of collection.indexes) {
        // biome-ignore lint/performance/noAwaitInLoops: Indexes apply in plan order.
        await coll.createIndex(index.keys, {
          name: index.name,
          ...(index.unique === true ? { unique: true } : {}),
          ...(index.partialFilterExpression === undefined
            ? {}
            : { partialFilterExpression: index.partialFilterExpression }),
        });
      }
    }
  } finally {
    await client.close();
  }
};

/**
 * Apply a MongoDB preset plan (or return the plan on dry-run).
 *
 * @param manifest - Preset manifest.
 * @param databaseUrl - Mongo connection URI.
 * @param dryRun - When true, skip network and return the plan only.
 * @returns Apply result with nosqlNotes.
 * @example
 * const effect = applyMongodbPreset(manifest, 'mongodb://localhost', true);
 */
const applyMongodbPreset = (
  manifest: PresetManifest,
  databaseUrl: string,
  dryRun: boolean,
): Effect.Effect<ApplyPresetResult, DbError> => {
  const nosqlNotes = renderNosqlPreset(manifest, 'mongodb');
  if (dryRun) {
    return Effect.succeed({
      presetId: manifest.id,
      provider: 'mongodb',
      nosqlNotes,
      applied: false,
    });
  }

  const plan = buildMongoApplyPlan(manifest);
  return Effect.tryPromise({
    try: async () => {
      await applyMongoCollections(plan.collections, databaseUrl);
      return {
        presetId: manifest.id,
        provider: 'mongodb' as const,
        nosqlNotes,
        applied: true,
      };
    },
    catch: (error) => new DbError({ code: 'apply_failed', message: errorMessage(error) }),
  });
};

/**
 * Whether Firebase Admin credentials appear configured for live apply.
 *
 * @returns True when a service-account path or JSON env is present.
 * @example
 * const ready = hasFirebaseCredentials();
 */
const hasFirebaseCredentials = (): boolean => {
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return (path !== undefined && path !== '') || (json !== undefined && json !== '');
};

/**
 * Create empty Firestore collections when Admin credentials are available.
 *
 * Firestore creates collections on first document write; apply writes and deletes
 * a short-lived `_vybekiit_bootstrap` doc per collection.
 *
 * @param collectionNames - Collection ids from the Firebase apply plan.
 * @returns Promise that resolves when collections are ensured.
 * @example
 * await ensureFirestoreCollections(['orders']);
 */
const ensureFirestoreCollections = async (collectionNames: readonly string[]): Promise<void> => {
  if (getApps().length === 0) {
    initializeApp();
  }
  const firestore = getFirestore();
  for (const name of collectionNames) {
    const ref = firestore.collection(name).doc('_vybekiit_bootstrap');
    // biome-ignore lint/performance/noAwaitInLoops: Sequential writes avoid burst rate limits on free tier.
    await ref.set({ bootstrappedAt: new Date().toISOString() });
    // biome-ignore lint/performance/noAwaitInLoops: Delete follows create for the same doc.
    await ref.delete();
  }
};

/**
 * Apply a Firebase preset plan (dry-run offline; live needs Admin credentials).
 *
 * @param manifest - Preset manifest.
 * @param dryRun - When true, skip network and return the plan only.
 * @returns Apply result with nosqlNotes.
 * @example
 * const effect = applyFirebasePreset(manifest, true);
 */
const applyFirebasePreset = (
  manifest: PresetManifest,
  dryRun: boolean,
): Effect.Effect<ApplyPresetResult, DbError> => {
  const nosqlNotes = renderNosqlPreset(manifest, 'firebase');
  if (dryRun) {
    return Effect.succeed({
      presetId: manifest.id,
      provider: 'firebase',
      nosqlNotes,
      applied: false,
    });
  }

  if (!hasFirebaseCredentials()) {
    return failPreset(
      'apply_failed',
      'Firebase live apply requires GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON. Run with --dry-run to print the stable apply plan offline.',
    );
  }

  const plan = buildFirebaseApplyPlan(manifest);
  return Effect.tryPromise({
    try: async () => {
      await ensureFirestoreCollections(plan.collections);
      return {
        presetId: manifest.id,
        provider: 'firebase' as const,
        nosqlNotes,
        applied: true,
      };
    },
    catch: (error) =>
      new DbError({
        code: 'apply_failed',
        message: `Firebase apply failed: ${errorMessage(error)}. Composite indexes from the plan still need deploying via firebase.json / gcloud.`,
      }),
  });
};

/**
 * Create one DynamoDB table from a plan, ignoring "already exists".
 *
 * @param client - Low-level DynamoDB client.
 * @param table - Table plan (key schema + GSIs).
 * @returns Promise that resolves when the table exists or was created.
 * @example
 * await createDynamoTable(client, plan.tables[0]);
 */
const createDynamoTable = async (client: DynamoDBClient, table: DynamoTablePlan): Promise<void> => {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: table.tableName,
        KeySchema: table.keySchema.map((entry) => ({
          AttributeName: entry.AttributeName,
          KeyType: entry.KeyType,
        })),
        AttributeDefinitions: table.attributeDefinitions.map((entry) => ({
          AttributeName: entry.AttributeName,
          AttributeType: entry.AttributeType,
        })),
        BillingMode: table.billingMode,
        ...(table.globalSecondaryIndexes.length > 0
          ? {
              GlobalSecondaryIndexes: table.globalSecondaryIndexes.map((gsi) => ({
                IndexName: gsi.IndexName,
                KeySchema: gsi.KeySchema.map((entry) => ({
                  AttributeName: entry.AttributeName,
                  KeyType: entry.KeyType,
                })),
                Projection: { ProjectionType: gsi.Projection.ProjectionType },
              })),
            }
          : {}),
      }),
    );
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      return;
    }
    throw error;
  }
};

/**
 * Apply an AWS DynamoDB preset plan (dry-run offline; live needs AWS credentials + region).
 *
 * @param manifest - Preset manifest.
 * @param dryRun - When true, skip network and return the plan only.
 * @returns Apply result with nosqlNotes.
 * @example
 * const effect = applyAwsPreset(manifest, true);
 */
const applyAwsPreset = (
  manifest: PresetManifest,
  dryRun: boolean,
): Effect.Effect<ApplyPresetResult, DbError> => {
  const nosqlNotes = renderNosqlPreset(manifest, 'aws');
  if (dryRun) {
    return Effect.succeed({
      presetId: manifest.id,
      provider: 'aws',
      nosqlNotes,
      applied: false,
    });
  }

  const region = process.env.AWS_REGION;
  if (region === undefined || region === '') {
    return failPreset(
      'apply_failed',
      'AWS live apply requires AWS_REGION (and credentials via the default SDK chain or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY). Run with --dry-run to print the stable apply plan offline.',
    );
  }

  const plan = buildAwsApplyPlan(manifest);
  return Effect.tryPromise({
    try: async () => {
      const client = new DynamoDBClient({ region });
      try {
        for (const table of plan.tables) {
          // biome-ignore lint/performance/noAwaitInLoops: Tables create sequentially to surface clear errors.
          await createDynamoTable(client, table);
        }
        return {
          presetId: manifest.id,
          provider: 'aws' as const,
          nosqlNotes,
          applied: true,
        };
      } finally {
        client.destroy();
      }
    },
    catch: (error) => new DbError({ code: 'apply_failed', message: errorMessage(error) }),
  });
};

/**
 * Apply a NoSQL preset for mongodb, firebase, or aws.
 *
 * @param manifest - Loaded preset manifest.
 * @param provider - NoSQL provider target.
 * @param databaseUrl - Connection URL (Mongo URI for mongodb; unused on dry-run firebase/aws).
 * @param dryRun - When true, return the plan without contacting the cloud.
 * @returns Apply result with nosqlNotes and applied flag.
 * @example
 * const effect = applyNosqlPreset(manifest, 'mongodb', uri, true);
 */
const applyNosqlPreset = (
  manifest: PresetManifest,
  provider: NosqlProviderName,
  databaseUrl: string,
  dryRun: boolean,
): Effect.Effect<ApplyPresetResult, DbError> => {
  if (provider === 'mongodb') {
    return applyMongodbPreset(manifest, databaseUrl, dryRun);
  }
  if (provider === 'firebase') {
    return applyFirebasePreset(manifest, dryRun);
  }
  return applyAwsPreset(manifest, dryRun);
};

/**
 * Apply a preset migration to a Postgres or NoSQL database.
 *
 * @param options - Preset id, provider, database URL, and optional dry-run flag.
 * @returns An Effect containing the applied metadata or a stable failure.
 * @example
 * const result = await Effect.runPromise(applyPreset({ presetId: 'orders', provider: 'supabase', databaseUrl }));
 * @example
 * const dry = await Effect.runPromise(applyPreset({ presetId: 'orders', provider: 'mongodb', databaseUrl: 'mongodb://localhost', dryRun: true }));
 */
export const applyPreset = (
  options: ApplyPresetOptions,
): Effect.Effect<ApplyPresetResult, DbError> => {
  const manifest = getPreset(options.presetId);
  if (manifest === undefined) {
    return failPreset('not_found', `Unknown preset "${options.presetId}".`);
  }

  if (isNosqlProvider(options.provider)) {
    return applyNosqlPreset(
      manifest,
      options.provider,
      options.databaseUrl,
      options.dryRun === true,
    );
  }

  const { sql } = renderPreset(manifest, options.provider);
  if (sql === undefined) {
    return failPreset(
      'unsupported',
      `Preset "${options.presetId}" has no SQL for ${options.provider}.`,
    );
  }

  if (options.dryRun === true) {
    return Effect.succeed({
      presetId: options.presetId,
      provider: options.provider,
      sql,
      applied: false,
    });
  }

  return Effect.tryPromise({
    try: async () => {
      const sqlClient = neon(options.databaseUrl) as SqlClient;
      await executeMigration(sqlClient, sql);
      return {
        presetId: options.presetId,
        provider: options.provider,
        sql,
        applied: true,
      };
    },
    catch: (error) => new DbError({ code: 'apply_failed', message: errorMessage(error) }),
  });
};

/**
 * Apply one preset and append the result to the collected migration list.
 *
 * @param results - Mutable result collector owned by applyPresets.
 * @param presetId - Preset id to apply.
 * @param provider - Provider target.
 * @param databaseUrl - Database connection URL.
 * @param dryRun - Whether to render without executing.
 * @returns Effect that appends one applied preset result.
 * @example
 * const effect = appendAppliedPreset(results, 'orders', 'supabase', databaseUrl, true);
 */
const appendAppliedPreset = (
  results: ApplyPresetResult[],
  presetId: string,
  provider: PostgresProviderName | NosqlProviderName,
  databaseUrl: string,
  dryRun: boolean,
): Effect.Effect<void, DbError> =>
  applyPreset({ presetId, provider, databaseUrl, dryRun }).pipe(
    Effect.tap((result) =>
      Effect.sync(() => {
        results.push(result);
      }),
    ),
    Effect.asVoid,
  );

/**
 * Apply multiple presets in the supplied order.
 *
 * @param presetIds - Preset ids to apply.
 * @param provider - Provider target.
 * @param databaseUrl - Database connection URL.
 * @param dryRun - Whether to render without executing.
 * @returns An Effect containing every applied preset, or the first failure.
 * @example
 * const result = await Effect.runPromise(applyPresets(['orders'], 'supabase', databaseUrl, true));
 */
export const applyPresets = (
  presetIds: readonly string[],
  provider: PostgresProviderName | NosqlProviderName,
  databaseUrl: string,
  dryRun = false,
): Effect.Effect<readonly ApplyPresetResult[], DbError> =>
  Effect.gen(function* () {
    const results: ApplyPresetResult[] = [];
    for (const presetId of presetIds) {
      yield* appendAppliedPreset(results, presetId, provider, databaseUrl, dryRun);
    }
    return results;
  });

/**
 * Resolve a Postgres provider from `DATA_PROVIDER`.
 *
 * @param dataProvider - Raw provider value from env.
 * @returns A Postgres provider name, or `null` for non-Postgres providers.
 * @example
 * const provider = resolvePostgresProvider(process.env.DATA_PROVIDER);
 */
export const resolvePostgresProvider = (
  dataProvider: string | undefined,
): PostgresProviderName | null => {
  if (dataProvider === 'supabase' || dataProvider === 'neon' || dataProvider === 'railway') {
    return dataProvider;
  }
  return null;
};

/**
 * Resolve the maintainer path for rendered preset SQL.
 *
 * @param presetId - Preset id being rendered.
 * @param provider - Postgres provider target.
 * @returns Relative path for generated SQL.
 * @example
 * const path = renderedMigrationPath('orders', 'supabase');
 */
export const renderedMigrationPath = (presetId: string, provider: PostgresProviderName): string =>
  `presets/${presetId}/rendered/${provider}.sql`;

/**
 * Render SQL for a Postgres preset.
 *
 * @param manifest - Preset manifest to render.
 * @param provider - Postgres provider target.
 * @returns Rendered SQL.
 * @throws When the renderer does not produce SQL for a Postgres provider.
 * @example
 * const sql = renderPresetSql(manifest, 'supabase');
 */
export const renderPresetSql = (
  manifest: PresetManifest,
  provider: PostgresProviderName,
): string => {
  const rendered = renderPreset(manifest, provider);
  if (rendered.sql === undefined) {
    throw new Error(`Preset "${manifest.id}" did not render SQL for ${provider}.`);
  }
  return rendered.sql;
};
