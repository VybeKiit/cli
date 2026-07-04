import { fail, ok, type Result, type SupabaseConfig } from '@vybekiit/core';
import { createDbClient } from '@vybekiit/db/client';
import {
  type DataProviderResult,
  type StorageProviderResult,
  toEffectDataProvider,
  toEffectStorageProvider,
} from '@vybekiit/db/effectBridge';
import { POSTGRES_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import {
  supabaseBulkInsert,
  supabaseFullTextSearch,
  supabaseIdempotentInsert,
  supabaseUpsert,
} from '@vybekiit/db/providers/postgres/supabaseCapabilities';
import type { DataProvider, DbRecord, QueryFilter, StorageProvider } from '@vybekiit/db/types';

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
interface DynamicTable {
  insert(record: DbRecord | DbRecord[]): {
    select(): {
      single(): Promise<{
        data: DbRecord | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
  upsert(
    record: DbRecord,
    options: { onConflict: string },
  ): {
    select(): {
      single(): Promise<{
        data: DbRecord | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
  select(columns: string): {
    eq(
      column: string,
      value: string,
    ): { maybeSingle(): Promise<{ data: DbRecord | null; error: { message: string } | null }> };
    match(filter: Record<string, unknown>): Promise<{
      data: DbRecord[] | null;
      error: { message: string } | null;
    }>;
    textSearch(
      column: string,
      query: string,
      options?: { config?: string; type?: string },
    ): {
      limit(n: number): Promise<{ data: DbRecord[] | null; error: { message: string } | null }>;
    };
  };
  update(patch: Record<string, unknown>): {
    eq(
      column: string,
      value: string,
    ): {
      select(): {
        single(): Promise<{ data: DbRecord | null; error: { message: string } | null }>;
      };
    };
  };
  delete(): { eq(column: string, value: string): Promise<{ error: { message: string } | null }> };
}

/**
 * Build the Supabase {@link DataProvider} — VybeKiit's v1 default data backend
 * (Postgres with batteries-included auth/storage). Wraps the existing
 * {@link createDbClient} so the normalized CRUD seam reuses the same server-side
 * client (service-role key when available) the rest of the kit already trusts.
 *
 * Each method maps a Supabase `PostgrestError` into a {@link Result} failure with a
 * stable code, so callers branch on expected boundary errors instead of catching
 * thrown exceptions.
 */
export function createSupabaseDataProvider(config: SupabaseConfig): DataProvider {
  const client = createDbClient(config);
  // See {@link DynamicTable}: the table name is runtime-defined, so we adapt the
  // untyped builder to a record-oriented contract here, once, rather than per call.
  const table = (collection: string): DynamicTable =>
    client.from(collection) as unknown as DynamicTable;

  const impl: DataProviderResult = {
    name: 'supabase',
    capabilities: POSTGRES_CAPABILITIES,

    async insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      const { data, error } = await table(collection).insert(record).select().single();
      if (error) return fail('db_insert_failed', error.message);
      return ok(data as T);
    },

    async get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>> {
      const { data, error } = await table(collection).select('*').eq('id', id).maybeSingle();
      if (error) return fail('db_get_failed', error.message);
      return ok((data as T | null) ?? null);
    },

    async query<T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Promise<Result<T[]>> {
      const { data, error } = await table(collection).select('*').match(filter);
      if (error) return fail('db_query_failed', error.message);
      return ok((data as T[] | null) ?? []);
    },

    async update<T extends DbRecord>(
      collection: string,
      id: string,
      patch: Partial<Omit<T, 'id'>>,
    ): Promise<Result<T>> {
      const { data, error } = await table(collection).update(patch).eq('id', id).select().single();
      if (error) return fail('db_update_failed', error.message);
      return ok(data as T);
    },

    async remove(collection: string, id: string): Promise<Result<true>> {
      const { error } = await table(collection).delete().eq('id', id);
      if (error) return fail('db_remove_failed', error.message);
      return ok(true);
    },

    upsert<T extends DbRecord>(
      collection: string,
      record: T,
      conflictKey: keyof T & string,
    ): Promise<Result<T>> {
      return supabaseUpsert(
        (name) =>
          table(name) as unknown as Parameters<typeof supabaseUpsert>[0] extends (
            n: string,
          ) => infer U
            ? U
            : never,
        collection,
        record,
        conflictKey,
      );
    },

    idempotentInsert<T extends DbRecord>(
      collection: string,
      record: T,
      dedupeKey: keyof T & string,
    ): Promise<Result<T>> {
      return supabaseIdempotentInsert(
        (name) =>
          table(name) as unknown as Parameters<typeof supabaseIdempotentInsert>[0] extends (
            n: string,
          ) => infer U
            ? U
            : never,
        collection,
        record,
        dedupeKey,
      );
    },

    fullTextSearch<T extends DbRecord>(
      collection: string,
      query: string,
      limit: number,
    ): Promise<Result<T[]>> {
      return supabaseFullTextSearch(
        (name) =>
          table(name) as unknown as Parameters<typeof supabaseFullTextSearch>[0] extends (
            n: string,
          ) => infer U
            ? U
            : never,
        collection,
        query,
        limit,
      );
    },

    bulkInsert<T extends DbRecord>(
      collection: string,
      records: readonly T[],
    ): Promise<Result<T[]>> {
      return supabaseBulkInsert(
        (name) =>
          table(name) as unknown as Parameters<typeof supabaseBulkInsert>[0] extends (
            n: string,
          ) => infer U
            ? U
            : never,
        collection,
        records,
      );
    },
  };
  return toEffectDataProvider(impl);
}

/**
 * Build the Supabase {@link StorageProvider} — the v1 default file store, backed by
 * Supabase Storage on the same project as the data backend. `getUrl` returns the
 * bucket's public URL; buckets a buyer marks private would instead need a signed
 * URL, but the default product surface uploads public assets.
 */
export function createSupabaseStorageProvider(config: SupabaseConfig): StorageProvider {
  const client = createDbClient(config);

  const impl: StorageProviderResult = {
    name: 'supabase',

    async upload(
      bucket: string,
      key: string,
      data: Uint8Array,
      contentType?: string,
    ): Promise<Result<{ key: string }>> {
      const { error } = await client.storage.from(bucket).upload(key, data, {
        upsert: true,
        ...(contentType ? { contentType } : {}),
      });
      if (error) return fail('storage_upload_failed', error.message);
      return ok({ key });
    },

    getUrl(bucket: string, key: string): Promise<Result<{ url: string }>> {
      const { data } = client.storage.from(bucket).getPublicUrl(key);
      return Promise.resolve(ok({ url: data.publicUrl }));
    },

    async remove(bucket: string, key: string): Promise<Result<true>> {
      const { error } = await client.storage.from(bucket).remove([key]);
      if (error) return fail('storage_remove_failed', error.message);
      return ok(true);
    },
  };
  return toEffectStorageProvider(impl);
}
