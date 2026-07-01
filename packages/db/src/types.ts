import { Data, type Effect } from 'effect';

/**
 * The data backends VybeKiit ships an adapter for. One runs at a time (chosen via
 * `DATA_PROVIDER`); the agent swaps by changing that one env value, because every
 * call site talks to the {@link DataProvider} interface rather than a specific
 * vendor. Supabase (Postgres) is the v1 default; `mongodb` (Atlas) and `aws`
 * (DynamoDB/DocumentDB) are opt-in adapters that ship in a later step (ADR-0002).
 * `local` is the zero-config, in-memory dev fallback (ADR-0008): no secrets, data
 * lives in a per-process `Map` and resets on restart, so a freshly scaffolded app
 * runs on the first `pnpm dev`. The resolver selects it implicitly when nothing is
 * configured — the builder never picks it.
 */
export type DataProviderName =
  | 'supabase'
  | 'neon'
  | 'firebase'
  | 'mongodb'
  | 'aws'
  | 'local'
  | 'railway';

/**
 * The minimal shape every stored record shares: a string primary key under `id`.
 *
 * Adapters generate/accept this id in whatever native form the backend uses (a
 * Postgres uuid, a Mongo `_id` mapped to `id`, a Dynamo partition key) so call
 * sites address records uniformly. Concrete record types extend this with their
 * own typed fields, e.g. `interface Order extends DbRecord { email: string }`.
 */
export interface DbRecord {
  /** Stable primary key, vendor-neutral at the call site. */
  readonly id: string;
}

/**
 * A simple equality filter for {@link DataProvider.query}: every listed field must
 * match exactly (AND semantics). Kept deliberately minimal for v1 (KISS) — it maps
 * cleanly onto a SQL `WHERE col = val`, a Mongo `find(eq)`, and a Dynamo query, so
 * no adapter has to interpret operators. Richer querying is out of scope here.
 *
 * @typeParam T - the record type being filtered
 */
export type QueryFilter<T extends DbRecord> = Partial<Omit<T, 'id'>>;

/** Optional advanced operations a {@link DataProvider} adapter may support. */
export type DataProviderCapabilities = {
  readonly upsert?: boolean;
  readonly idempotentInsert?: boolean;
  readonly vectorSearch?: boolean;
  readonly fullTextSearch?: boolean;
  readonly bulkInsert?: boolean;
  readonly transaction?: boolean;
};

/**
 * The tagged failure every data/storage method can produce (ADR-0023). Carries a
 * stable `code` (skills branch on it to pick a plain-language message) and a
 * developer-facing `message`. Replaces the old `Result`-carried `VybeKiitError`.
 */
export class DbError extends Data.TaggedError('DbError')<{
  readonly code: string;
  readonly message: string;
}> {}

/**
 * The swappable data seam — a small, vendor-neutral CRUD contract that Postgres,
 * MongoDB, and DynamoDB can all satisfy. Each adapter is constructed from its own
 * validated config (credentials live in the factory, not per call), so every method
 * is credential-free at the call site and uniform across backends. Skills are
 * written once against this interface; adding a backend adds an adapter, not a skill.
 *
 * `collection` is the table/collection name (a Postgres table, a Mongo collection,
 * a Dynamo table). Every method returns an {@link Effect.Effect} that fails with a
 * tagged {@link DbError} for expected boundary failures (not found, constraint
 * violation, network blip); composition roots run it at the edge.
 */
export interface DataProvider {
  /** Which backend this instance talks to. */
  readonly name: DataProviderName;
  /** Which optional operations this adapter implements. */
  readonly capabilities: DataProviderCapabilities;
  /** Insert a record and return it as stored (with its final `id`). */
  insert<T extends DbRecord>(collection: string, record: T): Effect.Effect<T, DbError>;
  /** Fetch one record by id; succeeds with `null` when no row matches. */
  get<T extends DbRecord>(collection: string, id: string): Effect.Effect<T | null, DbError>;
  /** Fetch every record matching an equality {@link QueryFilter}. */
  query<T extends DbRecord>(
    collection: string,
    filter: QueryFilter<T>,
  ): Effect.Effect<T[], DbError>;
  /** Patch fields of one record by id and return the updated record. */
  update<T extends DbRecord>(
    collection: string,
    id: string,
    patch: Partial<Omit<T, 'id'>>,
  ): Effect.Effect<T, DbError>;
  /** Delete one record by id. */
  remove(collection: string, id: string): Effect.Effect<true, DbError>;
  /** Insert or update on a non-id conflict key (when {@link DataProviderCapabilities.upsert}). */
  upsert?<T extends DbRecord>(
    collection: string,
    record: T,
    conflictKey: keyof T & string,
  ): Effect.Effect<T, DbError>;
  /** Insert once; return existing row when dedupe key collides. */
  idempotentInsert?<T extends DbRecord>(
    collection: string,
    record: T,
    dedupeKey: keyof T & string,
  ): Effect.Effect<T, DbError>;
  /** Approximate nearest-neighbor search on vector-enabled preset tables. */
  vectorSearch?<T extends DbRecord>(
    collection: string,
    embedding: readonly number[],
    limit: number,
  ): Effect.Effect<T[], DbError>;
  /** Full-text search on preset tables with tsvector columns. */
  fullTextSearch?<T extends DbRecord>(
    collection: string,
    query: string,
    limit: number,
  ): Effect.Effect<T[], DbError>;
  /** Insert many rows in one round trip. */
  bulkInsert?<T extends DbRecord>(
    collection: string,
    records: readonly T[],
  ): Effect.Effect<T[], DbError>;
  /** Run fn in a transaction when the adapter supports it. */
  withTransaction?<R>(
    fn: (tx: DataProvider) => Effect.Effect<R, DbError>,
  ): Effect.Effect<R, DbError>;
}

/**
 * The object-storage backends VybeKiit ships an adapter for, chosen via
 * `STORAGE_PROVIDER`. Supabase Storage is the default; `r2` is the Cloudflare stack path;
 * `s3` is the AWS opt-in adapter (ADR-0002).
 */
export type StorageProviderName = 'supabase' | 'r2' | 's3';

/**
 * The swappable file-storage seam. `bucket` is the storage container (a Supabase
 * Storage bucket, an S3 bucket); `key` is the object path within it. Like
 * {@link DataProvider}, the adapter is built from validated config so call sites
 * stay credential-free, and every method returns an {@link Effect.Effect} failing
 * with a tagged {@link DbError}.
 */
export interface StorageProvider {
  /** Which storage backend this instance talks to. */
  readonly name: StorageProviderName;
  /** Upload bytes to `bucket/key`; optional `contentType` sets the MIME type. */
  upload(
    bucket: string,
    key: string,
    data: Uint8Array,
    contentType?: string,
  ): Effect.Effect<{ key: string }, DbError>;
  /** Resolve a readable URL for an existing object. */
  getUrl(bucket: string, key: string): Effect.Effect<{ url: string }, DbError>;
  /** Delete an object at `bucket/key`. */
  remove(bucket: string, key: string): Effect.Effect<true, DbError>;
}
