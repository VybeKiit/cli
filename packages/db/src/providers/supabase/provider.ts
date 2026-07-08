import type { SupabaseConfig } from '@vybekiit/core';
import { createDbClient } from '@vybekiit/db/client';
import { failDb, tryDb } from '@vybekiit/db/providerEffect';
import { POSTGRES_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import {
  supabaseBulkInsert,
  supabaseFullTextSearch,
  supabaseIdempotentInsert,
  supabaseUpsert,
} from '@vybekiit/db/providers/postgres/supabaseCapabilities';
import type { DataProvider, DbRecord, QueryFilter, StorageProvider } from '@vybekiit/db/types';
import { Effect } from 'effect';

/**
 * The slice of the Supabase query builder this adapter uses, typed for *dynamic*
 * tables.
 *
 * Why this exists: `createDbClient` builds a `SupabaseClient` with no generated
 * `Database` type, so its `from()` resolves row shapes to `never`/`any` and fights
 * our generic `T extends DbRecord`. The kit's tables are buyer-defined at runtime
 * (the `save-data` skill creates them), so a compile-time schema isn't available here
 * regardless. We narrow `from()` to this record-oriented contract once, so method
 * bodies stay typed against `DbRecord` instead of leaking `any`.
 */
type DynamicTable = {
  readonly insert: (record: DbRecord | DbRecord[]) => {
    readonly select: () => {
      readonly single: () => Promise<{
        data: DbRecord | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
  readonly upsert: (
    record: DbRecord,
    options: { onConflict: string },
  ) => {
    readonly select: () => {
      readonly single: () => Promise<{
        data: DbRecord | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
  readonly select: (columns: string) => {
    readonly eq: (
      column: string,
      value: string,
    ) => {
      readonly maybeSingle: () => Promise<{
        data: DbRecord | null;
        error: { message: string } | null;
      }>;
    };
    readonly match: (filter: Record<string, unknown>) => Promise<{
      data: DbRecord[] | null;
      error: { message: string } | null;
    }>;
    readonly textSearch: (
      column: string,
      query: string,
      options?: { config?: string; type?: string },
    ) => {
      readonly limit: (
        n: number,
      ) => Promise<{ data: DbRecord[] | null; error: { message: string } | null }>;
    };
  };
  readonly update: (patch: Record<string, unknown>) => {
    readonly eq: (
      column: string,
      value: string,
    ) => {
      readonly select: () => {
        readonly single: () => Promise<{
          data: DbRecord | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
  readonly delete: () => {
    readonly eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
  };
};

/**
 * Build the Supabase {@link DataProvider} — VybeKiit's v1 default data backend
 * (Postgres with batteries-included auth/storage). Wraps the existing
 * {@link createDbClient} so the normalized CRUD seam reuses the same server-side
 * client (service-role key when available) the rest of the kit already trusts.
 *
 * @param config - Validated Supabase config.
 * @returns Data provider backed by Supabase Postgres.
 * @example
 * const provider = createSupabaseDataProvider(config);
 */
export const createSupabaseDataProvider =
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Adapter methods stay colocated with shared Supabase client state.
  (config: SupabaseConfig): DataProvider => {
    const client = createDbClient(config);
    // See {@link DynamicTable}: the table name is runtime-defined, so we adapt the
    // untyped builder to a record-oriented contract here, once, rather than per call.
    const table = (collection: string): DynamicTable =>
      client.from(collection) as unknown as DynamicTable;

    return {
      name: 'supabase',
      capabilities: POSTGRES_CAPABILITIES,

      insert: <T extends DbRecord>(collection: string, record: T) =>
        Effect.gen(function* () {
          const { data, error } = yield* tryDb(
            'db_insert_failed',
            () => table(collection).insert(record).select().single(),
            'unknown Supabase error',
          );
          if (error !== null) {
            return yield* failDb('db_insert_failed', error.message);
          }
          if (data === null) {
            return yield* failDb(
              'db_insert_failed',
              `Supabase returned no ${collection} row after insert.`,
            );
          }
          return data as T;
        }),

      get: <T extends DbRecord>(collection: string, id: string) =>
        Effect.gen(function* () {
          const { data, error } = yield* tryDb(
            'db_get_failed',
            () => table(collection).select('*').eq('id', id).maybeSingle(),
            'unknown Supabase error',
          );
          if (error !== null) {
            return yield* failDb('db_get_failed', error.message);
          }
          if (data === null) {
            return null;
          }
          return data as T;
        }),

      query: <T extends DbRecord>(collection: string, filter: QueryFilter<T>) =>
        Effect.gen(function* () {
          const { data, error } = yield* tryDb(
            'db_query_failed',
            () => table(collection).select('*').match(filter),
            'unknown Supabase error',
          );
          if (error !== null) {
            return yield* failDb('db_query_failed', error.message);
          }
          if (data === null) {
            return [];
          }
          return data as T[];
        }),

      update: <T extends DbRecord>(collection: string, id: string, patch: Partial<Omit<T, 'id'>>) =>
        Effect.gen(function* () {
          const { data, error } = yield* tryDb(
            'db_update_failed',
            () => table(collection).update(patch).eq('id', id).select().single(),
            'unknown Supabase error',
          );
          if (error !== null) {
            return yield* failDb('db_update_failed', error.message);
          }
          if (data === null) {
            return yield* failDb(
              'db_update_failed',
              `Supabase returned no ${collection} row after update.`,
            );
          }
          return data as T;
        }),

      remove: (collection: string, id: string) =>
        Effect.gen(function* () {
          const { error } = yield* tryDb(
            'db_remove_failed',
            () => table(collection).delete().eq('id', id),
            'unknown Supabase error',
          );
          if (error !== null) {
            return yield* failDb('db_remove_failed', error.message);
          }
          return true as const;
        }),

      upsert: <T extends DbRecord>(collection: string, record: T, conflictKey: keyof T & string) =>
        supabaseUpsert(
          (name) =>
            table(name) as unknown as Parameters<typeof supabaseUpsert>[0] extends (
              n: string,
            ) => infer U
              ? U
              : never,
          collection,
          record,
          conflictKey,
        ),

      idempotentInsert: <T extends DbRecord>(
        collection: string,
        record: T,
        dedupeKey: keyof T & string,
      ) =>
        supabaseIdempotentInsert(
          (name) =>
            table(name) as unknown as Parameters<typeof supabaseIdempotentInsert>[0] extends (
              n: string,
            ) => infer U
              ? U
              : never,
          collection,
          record,
          dedupeKey,
        ),

      fullTextSearch: <T extends DbRecord>(collection: string, query: string, limit: number) =>
        supabaseFullTextSearch<T>(
          (name) =>
            table(name) as unknown as Parameters<typeof supabaseFullTextSearch>[0] extends (
              n: string,
            ) => infer U
              ? U
              : never,
          collection,
          query,
          limit,
        ),

      bulkInsert: <T extends DbRecord>(collection: string, records: readonly T[]) =>
        supabaseBulkInsert(
          (name) =>
            table(name) as unknown as Parameters<typeof supabaseBulkInsert>[0] extends (
              n: string,
            ) => infer U
              ? U
              : never,
          collection,
          records,
        ),
    };
  };

/**
 * Build the Supabase {@link StorageProvider} for public asset buckets.
 *
 * @param config - Validated Supabase config.
 * @returns Storage provider backed by Supabase Storage.
 * @example
 * const provider = createSupabaseStorageProvider(config);
 */
export const createSupabaseStorageProvider = (config: SupabaseConfig): StorageProvider => {
  const client = createDbClient(config);

  return {
    name: 'supabase',

    upload: (bucket: string, key: string, data: Uint8Array, contentType?: string) =>
      Effect.gen(function* () {
        const options: { readonly upsert: true; readonly contentType?: string } = {
          upsert: true,
        };
        const uploadOptions = contentType === undefined ? options : { ...options, contentType };
        const { error } = yield* tryDb(
          'storage_upload_failed',
          () => client.storage.from(bucket).upload(key, data, uploadOptions),
          'unknown Supabase storage error',
        );
        if (error !== null) {
          return yield* failDb('storage_upload_failed', error.message);
        }
        return { key };
      }),

    getUrl: (bucket: string, key: string) => {
      const { data } = client.storage.from(bucket).getPublicUrl(key);
      return Effect.succeed({ url: data.publicUrl });
    },

    remove: (bucket: string, key: string) =>
      Effect.gen(function* () {
        const { error } = yield* tryDb(
          'storage_remove_failed',
          () => client.storage.from(bucket).remove([key]),
          'unknown Supabase storage error',
        );
        if (error !== null) {
          return yield* failDb('storage_remove_failed', error.message);
        }
        return true as const;
      }),
  };
};
