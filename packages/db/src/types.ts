import type { Result } from '@vybekiit/core';

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
export type DataProviderName = 'supabase' | 'mongodb' | 'aws' | 'local';

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

/**
 * The swappable data seam — a small, vendor-neutral CRUD contract that Postgres,
 * MongoDB, and DynamoDB can all satisfy. Each adapter is constructed from its own
 * validated config (credentials live in the factory, not per call), so every method
 * is credential-free at the call site and uniform across backends. Skills are
 * written once against this interface; adding a backend adds an adapter, not a skill.
 *
 * `collection` is the table/collection name (a Postgres table, a Mongo collection,
 * a Dynamo table). Every method returns a {@link Result} so expected boundary
 * failures (not found, constraint violation, network blip) are branched on by the
 * caller and translated to plain language, rather than thrown.
 */
export interface DataProvider {
  /** Which backend this instance talks to. */
  readonly name: DataProviderName;
  /** Insert a record and return it as stored (with its final `id`). */
  insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>>;
  /** Fetch one record by id; resolves `null` value when no row matches. */
  get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>>;
  /** Fetch every record matching an equality {@link QueryFilter}. */
  query<T extends DbRecord>(collection: string, filter: QueryFilter<T>): Promise<Result<T[]>>;
  /** Patch fields of one record by id and return the updated record. */
  update<T extends DbRecord>(
    collection: string,
    id: string,
    patch: Partial<Omit<T, 'id'>>,
  ): Promise<Result<T>>;
  /** Delete one record by id. */
  remove(collection: string, id: string): Promise<Result<true>>;
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
 * stay credential-free, and every method returns a {@link Result}.
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
  ): Promise<Result<{ key: string }>>;
  /** Resolve a readable URL for an existing object. */
  getUrl(bucket: string, key: string): Promise<Result<{ url: string }>>;
  /** Delete an object at `bucket/key`. */
  remove(bucket: string, key: string): Promise<Result<true>>;
}
