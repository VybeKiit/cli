import { type Result, fail, ok } from '@vybekiit/core';
import type { DbRecord } from '../../types';

interface UpsertTable {
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
  insert(record: DbRecord): {
    select(): {
      single(): Promise<{
        data: DbRecord | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
}

interface SearchTable {
  select(columns: string): {
    textSearch(
      column: string,
      query: string,
      options?: { config?: string; type?: string },
    ): {
      limit(n: number): Promise<{ data: DbRecord[] | null; error: { message: string } | null }>;
    };
  };
}

interface BulkTable {
  insert(records: DbRecord[]): {
    select(): Promise<{ data: DbRecord[] | null; error: { message: string } | null }>;
  };
}

export async function supabaseUpsert<T extends DbRecord>(
  table: (name: string) => UpsertTable,
  collection: string,
  record: T,
  conflictKey: keyof T & string,
): Promise<Result<T>> {
  const { data, error } = await table(collection)
    .upsert(record, { onConflict: conflictKey })
    .select()
    .single();
  if (error) return fail('db_upsert_failed', error.message);
  return ok(data as T);
}

export async function supabaseIdempotentInsert<T extends DbRecord>(
  table: (name: string) => UpsertTable,
  collection: string,
  record: T,
  dedupeKey: keyof T & string,
): Promise<Result<T>> {
  const { data, error } = await table(collection).insert(record).select().single();
  if (!error) return ok(data as T);
  if (error.code === '23505') {
    return supabaseUpsert(table, collection, record, dedupeKey);
  }
  return fail('db_insert_failed', error.message);
}

export async function supabaseFullTextSearch<T extends DbRecord>(
  table: (name: string) => SearchTable,
  collection: string,
  query: string,
  limit: number,
): Promise<Result<T[]>> {
  const { data, error } = await table(collection)
    .select('*')
    .textSearch('search_vector', query, { type: 'websearch', config: 'english' })
    .limit(limit);
  if (error) return fail('db_search_failed', error.message);
  return ok((data as T[] | null) ?? []);
}

export async function supabaseBulkInsert<T extends DbRecord>(
  table: (name: string) => BulkTable,
  collection: string,
  records: readonly T[],
): Promise<Result<T[]>> {
  const { data, error } = await table(collection)
    .insert([...records])
    .select();
  if (error) return fail('db_bulk_insert_failed', error.message);
  return ok((data as T[] | null) ?? []);
}
