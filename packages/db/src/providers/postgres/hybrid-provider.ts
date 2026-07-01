import { type Result, fail, ok } from '@vybekiit/core';
import { neon } from '@neondatabase/serverless';
import { PRESET_TABLE_NAMES } from '../../presets/catalog';
import type { DataProvider, DbRecord, QueryFilter } from '../../types';
import { POSTGRES_CAPABILITIES } from './shared';

export type SqlClient = {
  (strings: TemplateStringsArray, ...params: unknown[]): Promise<unknown[]>;
  (query: string, params?: unknown[]): Promise<unknown[]>;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isPresetTable(collection: string): boolean {
  return PRESET_TABLE_NAMES.has(collection);
}

function rowToRecord<T extends DbRecord>(row: Record<string, unknown>): T {
  return row as T;
}

async function ensureJsonbTable(sql: SqlClient): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS vybekiit_data (
      collection text NOT NULL,
      id text NOT NULL,
      payload jsonb NOT NULL DEFAULT '{}'::jsonb,
      PRIMARY KEY (collection, id)
    )
  `;
}

/** Hybrid Postgres provider: native tables for presets, jsonb blob for custom collections. */
export function createHybridPostgresProvider(
  sql: SqlClient,
  name: 'neon' | 'railway',
): DataProvider {
  return {
    name,
    capabilities: POSTGRES_CAPABILITIES,

    async insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      try {
        if (isPresetTable(collection)) {
          const id = record.id || crypto.randomUUID();
          const cols = { ...record, id };
          const keys = Object.keys(cols);
          const values = keys.map((key) => cols[key as keyof typeof cols]);
          const colList = keys.join(', ');
          const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
          await sql(
            `INSERT INTO public.${collection} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values,
          );
          return ok({ ...record, id } as T);
        }
        await ensureJsonbTable(sql);
        const id = record.id || crypto.randomUUID();
        const payload = { ...record };
        delete (payload as { id?: string }).id;
        await sql`
          INSERT INTO vybekiit_data (collection, id, payload)
          VALUES (${collection}, ${id}, ${JSON.stringify(payload)}::jsonb)
        `;
        return ok({ ...record, id } as T);
      } catch (error) {
        return fail('db_insert_failed', errorMessage(error));
      }
    },

    async get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>> {
      try {
        if (isPresetTable(collection)) {
          const rows = (await sql(`SELECT * FROM public.${collection} WHERE id = $1 LIMIT 1`, [
            id,
          ])) as Record<string, unknown>[];
          return ok(rows[0] ? rowToRecord<T>(rows[0]) : null);
        }
        await ensureJsonbTable(sql);
        const rows = await sql`
          SELECT id, payload FROM vybekiit_data
          WHERE collection = ${collection} AND id = ${id}
          LIMIT 1
        `;
        const row = rows[0] as { id: string; payload: Record<string, unknown> } | undefined;
        return ok(row ? rowToRecord<T>({ id: row.id, ...row.payload }) : null);
      } catch (error) {
        return fail('db_get_failed', errorMessage(error));
      }
    },

    async query<T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Promise<Result<T[]>> {
      try {
        if (isPresetTable(collection)) {
          const entries = Object.entries(filter);
          if (entries.length === 0) {
            const rows = (await sql(`SELECT * FROM public.${collection}`)) as Record<
              string,
              unknown
            >[];
            return ok(rows.map((row) => rowToRecord<T>(row)));
          }
          const where = entries.map(([key], index) => `${key} = $${index + 1}`).join(' AND ');
          const values = entries.map(([, value]) => value);
          const rows = (await sql(
            `SELECT * FROM public.${collection} WHERE ${where}`,
            values,
          )) as Record<string, unknown>[];
          return ok(rows.map((row) => rowToRecord<T>(row)));
        }
        await ensureJsonbTable(sql);
        const rows = (await sql`
          SELECT id, payload FROM vybekiit_data WHERE collection = ${collection}
        `) as Array<{ id: string; payload: Record<string, unknown> }>;
        const fields = Object.entries(filter);
        const matches = rows
          .map((row) => rowToRecord<T>({ id: row.id, ...row.payload }))
          .filter((record) => fields.every(([key, value]) => record[key as keyof T] === value));
        return ok(matches);
      } catch (error) {
        return fail('db_query_failed', errorMessage(error));
      }
    },

    async update<T extends DbRecord>(
      collection: string,
      id: string,
      patch: Partial<Omit<T, 'id'>>,
    ): Promise<Result<T>> {
      const existing = await this.get<T>(collection, id);
      if (!existing.ok) return existing;
      if (!existing.value) {
        return fail('not_found', `No record ${id} in ${collection}.`);
      }
      try {
        const updated = { ...existing.value, ...patch, id } as T;
        if (isPresetTable(collection)) {
          const entries = Object.entries(patch);
          if (entries.length === 0) return ok(updated);
          const setClause = entries.map(([key], index) => `${key} = $${index + 2}`).join(', ');
          const values = [id, ...entries.map(([, value]) => value)];
          await sql(`UPDATE public.${collection} SET ${setClause} WHERE id = $1`, values);
          return ok(updated);
        }
        const payload = { ...updated };
        delete (payload as { id?: string }).id;
        await sql`
          UPDATE vybekiit_data
          SET payload = ${JSON.stringify(payload)}::jsonb
          WHERE collection = ${collection} AND id = ${id}
        `;
        return ok(updated);
      } catch (error) {
        return fail('db_update_failed', errorMessage(error));
      }
    },

    async remove(collection: string, id: string): Promise<Result<true>> {
      try {
        if (isPresetTable(collection)) {
          const rows = (await sql(`DELETE FROM public.${collection} WHERE id = $1 RETURNING id`, [
            id,
          ])) as unknown[];
          if (!rows.length) {
            return fail('not_found', `No record ${id} in ${collection}.`);
          }
          return ok(true);
        }
        await ensureJsonbTable(sql);
        const rows = await sql`
          DELETE FROM vybekiit_data
          WHERE collection = ${collection} AND id = ${id}
          RETURNING id
        `;
        if (!rows.length) {
          return fail('not_found', `No record ${id} in ${collection}.`);
        }
        return ok(true);
      } catch (error) {
        return fail('db_remove_failed', errorMessage(error));
      }
    },

    async upsert<T extends DbRecord>(
      collection: string,
      record: T,
      conflictKey: keyof T & string,
    ): Promise<Result<T>> {
      try {
        const conflictValue = record[conflictKey];
        const existing = await this.query<T>(collection, {
          [conflictKey]: conflictValue,
        } as QueryFilter<T>);
        if (existing.ok && existing.value.length > 0) {
          const row = existing.value[0];
          if (row) {
            const updated = { ...row, ...record, id: row.id } as T;
            if (isPresetTable(collection)) {
              const entries = Object.entries(record).filter(([key]) => key !== 'id');
              if (entries.length > 0) {
                const setClause = entries
                  .map(([key], index) => `${key} = $${index + 2}`)
                  .join(', ');
                const values = [row.id, ...entries.map(([, value]) => value)];
                await sql(`UPDATE public.${collection} SET ${setClause} WHERE id = $1`, values);
              }
              return ok(updated);
            }
            const payload = { ...updated };
            delete (payload as { id?: string }).id;
            await sql`
              UPDATE vybekiit_data
              SET payload = ${JSON.stringify(payload)}::jsonb
              WHERE collection = ${collection} AND id = ${row.id}
            `;
            return ok(updated);
          }
        }
        return this.insert(collection, record);
      } catch (error) {
        return fail('db_upsert_failed', errorMessage(error));
      }
    },

    async idempotentInsert<T extends DbRecord>(
      collection: string,
      record: T,
      dedupeKey: keyof T & string,
    ): Promise<Result<T>> {
      const existing = await this.query<T>(collection, {
        [dedupeKey]: record[dedupeKey],
      } as QueryFilter<T>);
      if (existing.ok && existing.value[0]) {
        return ok(existing.value[0]);
      }
      return this.insert(collection, record);
    },

    async fullTextSearch<T extends DbRecord>(
      collection: string,
      query: string,
      limit: number,
    ): Promise<Result<T[]>> {
      try {
        const rows = (await sql(
          `SELECT * FROM public.${collection}
           WHERE search_vector @@ websearch_to_tsquery('english', $1)
           LIMIT $2`,
          [query, limit],
        )) as Record<string, unknown>[];
        return ok(rows.map((row) => rowToRecord<T>(row)));
      } catch (error) {
        return fail('db_search_failed', errorMessage(error));
      }
    },

    async bulkInsert<T extends DbRecord>(
      collection: string,
      records: readonly T[],
    ): Promise<Result<T[]>> {
      const inserted: T[] = [];
      for (const record of records) {
        const id = record.id || crypto.randomUUID();
        if (isPresetTable(collection)) {
          const cols = { ...record, id };
          const keys = Object.keys(cols);
          const values = keys.map((key) => cols[key as keyof typeof cols]);
          const colList = keys.join(', ');
          const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
          await sql(
            `INSERT INTO public.${collection} (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values,
          );
          inserted.push({ ...record, id } as T);
        } else {
          const payload = { ...record, id };
          delete (payload as { id?: string }).id;
          await ensureJsonbTable(sql);
          await sql`
            INSERT INTO vybekiit_data (collection, id, payload)
            VALUES (${collection}, ${id}, ${JSON.stringify(payload)}::jsonb)
          `;
          inserted.push({ ...record, id } as T);
        }
      }
      return ok(inserted);
    },
  };
}
