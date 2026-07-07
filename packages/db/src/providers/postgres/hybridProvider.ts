// biome-ignore-all lint/complexity/noExcessiveCognitiveComplexity: Hybrid provider keeps native-table and JSONB conflict behavior colocated.
// biome-ignore-all lint/style/noExcessiveLinesPerFile: Splitting this adapter would hide shared SQL state across operations.

import { PRESET_TABLE_NAMES } from '@vybekiit/db/presets/catalog';
import { failDb, tryDb } from '@vybekiit/db/providerEffect';
import type { DataProvider, DbError, DbRecord, QueryFilter } from '@vybekiit/db/types';
import { Effect } from 'effect';
import { POSTGRES_CAPABILITIES } from './shared';

export type SqlClient = {
  (strings: TemplateStringsArray, ...params: unknown[]): Promise<unknown[]>;
  (query: string, params?: unknown[]): Promise<unknown[]>;
};

/**
 * Return whether a collection is backed by a native preset table.
 *
 * @param collection - Collection name to classify.
 * @returns `true` when the collection has a generated Postgres table.
 * @example
 * const native = isPresetTable('orders');
 */
const isPresetTable = (collection: string): boolean => PRESET_TABLE_NAMES.has(collection);

/**
 * Narrow a dynamic Postgres row to the caller's record type.
 *
 * @param row - Postgres row returned from a dynamic table.
 * @returns Row narrowed to the caller's record type.
 * @example
 * const order = rowToRecord<OrderRecord>(row);
 */
const rowToRecord = <T extends DbRecord>(row: Record<string, unknown>): T => row as T;

/**
 * Resolve the stored id for a hybrid Postgres record.
 *
 * @param id - Caller-provided record id.
 * @returns The provided id, or a generated id when the caller supplied an empty string.
 * @example
 * const id = recordId(record.id);
 */
const recordId = (id: string): string => {
  if (id.length === 0) {
    return crypto.randomUUID();
  }
  return id;
};

/**
 * Return the JSONB payload shape for a record by removing the provider id field.
 *
 * @param record - Record being stored in the JSONB fallback table.
 * @returns Record payload without the top-level `id`.
 * @example
 * const payload = payloadWithoutId(record);
 */
const payloadWithoutId = <T extends DbRecord>(record: T): Record<string, unknown> => {
  const { id: _id, ...payload } = record;
  return payload;
};

/**
 * Ensure the JSONB fallback table exists before custom collection writes.
 *
 * @param sql - SQL client used by the provider.
 * @returns Promise that resolves after the table exists.
 * @example
 * await ensureJsonbTable(sql);
 */
const ensureJsonbTable = async (sql: SqlClient): Promise<void> => {
  await sql`
    CREATE TABLE IF NOT EXISTS vybekiit_data (
      collection text NOT NULL,
      id text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      PRIMARY KEY (collection, id)
    )
  `;
};

/**
 * Build a hybrid Postgres provider for native preset tables plus JSONB custom data.
 *
 * @param sql - SQL client for the selected Postgres host.
 * @param name - Provider identity exposed to callers.
 * @returns Data provider backed by the selected Postgres host.
 * @example
 * const provider = createHybridPostgresProvider(sql, 'neon');
 */
export const createHybridPostgresProvider =
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Hybrid adapter keeps native-table and JSONB methods near shared SQL helpers.
  (sql: SqlClient, name: 'neon' | 'railway'): DataProvider => {
    const insert = <T extends DbRecord>(collection: string, record: T): Effect.Effect<T, DbError> =>
      tryDb(
        'db_insert_failed',
        async () => {
          if (isPresetTable(collection)) {
            const id = recordId(record.id);
            const cols = { ...record, id };
            const keys = Object.keys(cols);
            const values = keys.map((key) => cols[key as keyof typeof cols]);
            const colList = keys.join(', ');
            const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
            await sql(
              `INSERT INTO public.${collection} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
              values,
            );
            return { ...record, id } as T;
          }
          await ensureJsonbTable(sql);
          const id = recordId(record.id);
          const payload = payloadWithoutId(record);
          await sql`
          INSERT INTO vybekiit_data (collection, id, payload)
          VALUES (${collection}, ${id}, ${JSON.stringify(payload)}::jsonb)
        `;
          return { ...record, id } as T;
        },
        'unknown Postgres error',
      );

    const get = <T extends DbRecord>(
      collection: string,
      id: string,
    ): Effect.Effect<T | null, DbError> =>
      tryDb(
        'db_get_failed',
        async () => {
          if (isPresetTable(collection)) {
            const rows = (await sql(`SELECT * FROM public.${collection} WHERE id = $1 LIMIT 1`, [
              id,
            ])) as Record<string, unknown>[];
            const [row] = rows;
            if (row === undefined) {
              return null;
            }
            return rowToRecord<T>(row);
          }
          await ensureJsonbTable(sql);
          const rows = await sql`
          SELECT id, payload FROM vybekiit_data
          WHERE collection = ${collection} AND id = ${id}
          LIMIT 1
        `;
          const row = rows[0] as { id: string; payload: Record<string, unknown> } | undefined;
          if (row === undefined) {
            return null;
          }
          return rowToRecord<T>({ id: row.id, ...row.payload });
        },
        'unknown Postgres error',
      );

    const query = <T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Effect.Effect<T[], DbError> =>
      tryDb(
        'db_query_failed',
        async () => {
          if (isPresetTable(collection)) {
            const entries = Object.entries(filter);
            if (entries.length === 0) {
              const rows = (await sql(`SELECT * FROM public.${collection}`)) as Record<
                string,
                unknown
              >[];
              return rows.map((row) => rowToRecord<T>(row));
            }
            const where = entries.map(([key], index) => `${key} = $${index + 1}`).join(' AND ');
            const values = entries.map(([, value]) => value);
            const rows = (await sql(
              `SELECT * FROM public.${collection} WHERE ${where}`,
              values,
            )) as Record<string, unknown>[];
            return rows.map((row) => rowToRecord<T>(row));
          }
          await ensureJsonbTable(sql);
          const rows = (await sql`
          SELECT id, payload FROM vybekiit_data WHERE collection = ${collection}
        `) as Array<{ id: string; payload: Record<string, unknown> }>;
          const fields = Object.entries(filter);
          const matches = rows
            .map((row) => rowToRecord<T>({ id: row.id, ...row.payload }))
            .filter((record) => fields.every(([key, value]) => record[key as keyof T] === value));
          return matches;
        },
        'unknown Postgres error',
      );

    const update = <T extends DbRecord>(
      collection: string,
      id: string,
      patch: Partial<Omit<T, 'id'>>,
    ): Effect.Effect<T, DbError> =>
      Effect.gen(function* () {
        const existing = yield* get<T>(collection, id);
        if (existing === null) {
          return yield* failDb('not_found', `No record ${id} in ${collection}.`);
        }
        const updated = { ...existing, ...patch, id } as T;
        yield* tryDb(
          'db_update_failed',
          async () => {
            if (isPresetTable(collection)) {
              const entries = Object.entries(patch);
              if (entries.length === 0) {
                return;
              }
              const setClause = entries.map(([key], index) => `${key} = $${index + 2}`).join(', ');
              const values = [id, ...entries.map(([, value]) => value)];
              await sql(`UPDATE public.${collection} SET ${setClause} WHERE id = $1`, values);
              return;
            }
            const payload = payloadWithoutId(updated);
            await sql`
          UPDATE vybekiit_data
          SET payload = ${JSON.stringify(payload)}::jsonb
          WHERE collection = ${collection} AND id = ${id}
        `;
          },
          'unknown Postgres error',
        );
        return updated;
      });

    const remove = (collection: string, id: string): Effect.Effect<true, DbError> =>
      Effect.gen(function* () {
        const removed = yield* tryDb(
          'db_remove_failed',
          async () => {
            if (isPresetTable(collection)) {
              const rows = (await sql(
                `DELETE FROM public.${collection} WHERE id = $1 RETURNING id`,
                [id],
              )) as unknown[];
              return rows.length > 0;
            }
            await ensureJsonbTable(sql);
            const rows = await sql`
          DELETE FROM vybekiit_data
          WHERE collection = ${collection} AND id = ${id}
          RETURNING id
        `;
            return rows.length > 0;
          },
          'unknown Postgres error',
        );
        if (!removed) {
          return yield* failDb('not_found', `No record ${id} in ${collection}.`);
        }
        return true as const;
      });

    const upsert = <T extends DbRecord>(
      collection: string,
      record: T,
      conflictKey: keyof T & string,
    ): Effect.Effect<T, DbError> =>
      Effect.gen(function* () {
        const conflictValue = record[conflictKey];
        const existing = yield* query<T>(collection, {
          [conflictKey]: conflictValue,
        } as QueryFilter<T>);
        const [row] = existing;
        if (row !== undefined) {
          const updated = { ...row, ...record, id: row.id } as T;
          yield* tryDb(
            'db_upsert_failed',
            async () => {
              if (isPresetTable(collection)) {
                const entries = Object.entries(record).filter(([key]) => key !== 'id');
                if (entries.length > 0) {
                  const setClause = entries
                    .map(([key], index) => `${key} = $${index + 2}`)
                    .join(', ');
                  const values = [row.id, ...entries.map(([, value]) => value)];
                  await sql(`UPDATE public.${collection} SET ${setClause} WHERE id = $1`, values);
                }
                return;
              }
              const payload = payloadWithoutId(updated);
              await sql`
              UPDATE vybekiit_data
              SET payload = ${JSON.stringify(payload)}::jsonb
              WHERE collection = ${collection} AND id = ${row.id}
            `;
            },
            'unknown Postgres error',
          );
          return updated;
        }
        return yield* insert(collection, record);
      });

    const idempotentInsert = <T extends DbRecord>(
      collection: string,
      record: T,
      dedupeKey: keyof T & string,
    ): Effect.Effect<T, DbError> =>
      Effect.gen(function* () {
        const existing = yield* query<T>(collection, {
          [dedupeKey]: record[dedupeKey],
        } as QueryFilter<T>);
        const [row] = existing;
        if (row !== undefined) {
          return row;
        }
        return yield* insert(collection, record);
      });

    const fullTextSearch = <T extends DbRecord>(
      collection: string,
      search: string,
      limit: number,
    ): Effect.Effect<T[], DbError> =>
      tryDb(
        'db_search_failed',
        async () => {
          const rows = (await sql(
            `SELECT * FROM public.${collection}
           WHERE search_vector @@ websearch_to_tsquery('english', $1)
           LIMIT $2`,
            [search, limit],
          )) as Record<string, unknown>[];
          return rows.map((row) => rowToRecord<T>(row));
        },
        'unknown Postgres error',
      );

    const bulkInsert = <T extends DbRecord>(
      collection: string,
      records: readonly T[],
    ): Effect.Effect<T[], DbError> =>
      tryDb(
        'db_bulk_insert_failed',
        async () => {
          const inserted: T[] = [];
          for (const record of records) {
            const id = recordId(record.id);
            if (isPresetTable(collection)) {
              const cols = { ...record, id };
              const keys = Object.keys(cols);
              const values = keys.map((key) => cols[key as keyof typeof cols]);
              const colList = keys.join(', ');
              const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
              // biome-ignore lint/performance/noAwaitInLoops: Bulk inserts run in order so returned rows match input order.
              await sql(
                `INSERT INTO public.${collection} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                values,
              );
              inserted.push({ ...record, id } as T);
            } else {
              const payload = payloadWithoutId({ ...record, id } as T);
              await ensureJsonbTable(sql);
              await sql`
            INSERT INTO vybekiit_data (collection, id, payload)
            VALUES (${collection}, ${id}, ${JSON.stringify(payload)}::jsonb)
          `;
              inserted.push({ ...record, id } as T);
            }
          }
          return inserted;
        },
        'unknown Postgres error',
      );

    return {
      name,
      capabilities: POSTGRES_CAPABILITIES,
      insert,
      get,
      query,
      update,
      remove,
      upsert,
      idempotentInsert,
      fullTextSearch,
      bulkInsert,
    };
  };
