import { type NeonConfig, type Result, fail, ok } from '@vybekiit/core';
import { neon } from '@neondatabase/serverless';
import type { DataProvider, DbRecord, QueryFilter } from '../../types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Build the Neon serverless Postgres {@link DataProvider} — opt-in via
 * `DATA_PROVIDER=neon`. Uses one jsonb table keyed by collection + id.
 */
export function createNeonDataProvider(config: NeonConfig): DataProvider {
  const sql = neon(config.DATABASE_URL);

  async function ensureTable(): Promise<void> {
    await sql`
      CREATE TABLE IF NOT EXISTS vybekiit_data (
        collection text NOT NULL,
        id text NOT NULL,
        payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        PRIMARY KEY (collection, id)
      )
    `;
  }

  function rowToRecord<T extends DbRecord>(row: {
    id: string;
    payload: Record<string, unknown>;
  }): T {
    return { id: row.id, ...row.payload } as T;
  }

  return {
    name: 'neon',

    async insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      try {
        await ensureTable();
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
        await ensureTable();
        const rows = await sql`
          SELECT id, payload FROM vybekiit_data
          WHERE collection = ${collection} AND id = ${id}
          LIMIT 1
        `;
        const row = rows[0] as { id: string; payload: Record<string, unknown> } | undefined;
        return ok(row ? rowToRecord<T>(row) : null);
      } catch (error) {
        return fail('db_get_failed', errorMessage(error));
      }
    },

    async query<T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Promise<Result<T[]>> {
      try {
        await ensureTable();
        const rows = (await sql`
          SELECT id, payload FROM vybekiit_data WHERE collection = ${collection}
        `) as Array<{ id: string; payload: Record<string, unknown> }>;
        const fields = Object.entries(filter);
        const matches = rows
          .map((row) => rowToRecord<T>(row))
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
      try {
        const existing = await this.get<T>(collection, id);
        if (!existing.ok) return existing;
        if (!existing.value) {
          return fail('not_found', `No record ${id} in ${collection}.`);
        }
        const updated = { ...existing.value, ...patch, id } as T;
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
        await ensureTable();
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
  };
}

/** Neon connectivity probe — `SELECT 1`. */
export async function pingNeonDatabase(databaseUrl: string): Promise<Result<true>> {
  try {
    const sql = neon(databaseUrl);
    await sql`SELECT 1 AS ok`;
    return ok(true);
  } catch (error) {
    return fail('db_unreachable', errorMessage(error));
  }
}
