import { failDb, tryDb } from '@vybekiit/db/providerEffect';
import type { DbError, DbRecord } from '@vybekiit/db/types';
import { Effect } from 'effect';

type UpsertTable = {
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
  readonly insert: (record: DbRecord) => {
    readonly select: () => {
      readonly single: () => Promise<{
        data: DbRecord | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
};

type SearchTable = {
  readonly select: (columns: string) => {
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
};

type BulkTable = {
  readonly insert: (records: DbRecord[]) => {
    readonly select: () => Promise<{
      data: DbRecord[] | null;
      error: { message: string } | null;
    }>;
  };
};

/**
 * Upsert a Supabase row using a conflict key.
 *
 * @param table - Supabase table accessor narrowed to the capability contract.
 * @param collection - Table name to mutate.
 * @param record - Record to write.
 * @param conflictKey - Unique key Supabase should use for conflict detection.
 * @returns Effect containing the written row or a stable failure.
 * @example
 * const result = await supabaseUpsert(table, 'orders', order, 'id');
 */
export const supabaseUpsert = <T extends DbRecord>(
  table: (name: string) => UpsertTable,
  collection: string,
  record: T,
  conflictKey: keyof T & string,
): Effect.Effect<T, DbError> =>
  Effect.gen(function* () {
    const { data, error } = yield* tryDb(
      'db_upsert_failed',
      () => table(collection).upsert(record, { onConflict: conflictKey }).select().single(),
      'unknown Supabase error',
    );
    if (error !== null) {
      return yield* failDb('db_upsert_failed', error.message);
    }
    if (data === null) {
      return yield* failDb(
        'db_upsert_failed',
        `Supabase returned no ${collection} row after upsert.`,
      );
    }
    return data as T;
  });

/**
 * Insert a Supabase row and reuse the existing row when the dedupe key conflicts.
 *
 * @param table - Supabase table accessor narrowed to the capability contract.
 * @param collection - Table name to mutate.
 * @param record - Record to insert.
 * @param dedupeKey - Unique key that makes repeated inserts idempotent.
 * @returns Effect containing the inserted or existing row.
 * @example
 * const result = await supabaseIdempotentInsert(table, 'orders', order, 'externalId');
 */
export const supabaseIdempotentInsert = <T extends DbRecord>(
  table: (name: string) => UpsertTable,
  collection: string,
  record: T,
  dedupeKey: keyof T & string,
): Effect.Effect<T, DbError> =>
  Effect.gen(function* () {
    const { data, error } = yield* tryDb(
      'db_insert_failed',
      () => table(collection).insert(record).select().single(),
      'unknown Supabase error',
    );
    if (error === null) {
      if (data === null) {
        return yield* failDb(
          'db_insert_failed',
          `Supabase returned no ${collection} row after insert.`,
        );
      }
      return data as T;
    }
    if (error.code === '23505') {
      return yield* supabaseUpsert(table, collection, record, dedupeKey);
    }
    return yield* failDb('db_insert_failed', error.message);
  });

/**
 * Run a Supabase full-text search against a generated `search_vector` column.
 *
 * @param table - Supabase table accessor narrowed to the search contract.
 * @param collection - Table name to search.
 * @param query - Web-search query string.
 * @param limit - Maximum number of rows to return.
 * @returns Effect containing matching rows, or an empty array when none are returned.
 * @example
 * const result = await supabaseFullTextSearch(table, 'posts', 'pricing page', 10);
 */
export const supabaseFullTextSearch = <T extends DbRecord>(
  table: (name: string) => SearchTable,
  collection: string,
  query: string,
  limit: number,
): Effect.Effect<T[], DbError> =>
  Effect.gen(function* () {
    const { data, error } = yield* tryDb(
      'db_search_failed',
      () =>
        table(collection)
          .select('*')
          .textSearch('search_vector', query, { type: 'websearch', config: 'english' })
          .limit(limit),
      'unknown Supabase error',
    );
    if (error !== null) {
      return yield* failDb('db_search_failed', error.message);
    }
    if (data === null) {
      return [];
    }
    return data as T[];
  });

/**
 * Insert multiple Supabase rows and return the rows echoed by PostgREST.
 *
 * @param table - Supabase table accessor narrowed to the bulk insert contract.
 * @param collection - Table name to mutate.
 * @param records - Records to insert.
 * @returns Effect containing inserted rows, or an empty array when none are returned.
 * @example
 * const result = await supabaseBulkInsert(table, 'events', events);
 */
export const supabaseBulkInsert = <T extends DbRecord>(
  table: (name: string) => BulkTable,
  collection: string,
  records: readonly T[],
): Effect.Effect<T[], DbError> =>
  Effect.gen(function* () {
    const { data, error } = yield* tryDb(
      'db_bulk_insert_failed',
      () =>
        table(collection)
          .insert([...records])
          .select(),
      'unknown Supabase error',
    );
    if (error !== null) {
      return yield* failDb('db_bulk_insert_failed', error.message);
    }
    if (data === null) {
      return [];
    }
    return data as T[];
  });
