// `@aws-sdk/client-dynamodb` is the low-level DynamoDB client; `@aws-sdk/lib-dynamodb`
// wraps it in a DocumentClient that marshals plain JS objects to/from DynamoDB's
// AttributeValue wire format. We use the DocumentClient so adapter code reads/writes
// ordinary records and never hand-builds `{ S: '...' }` attribute typing — chosen
// over the raw client purely for that ergonomics + type cleanliness.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { type AwsConfig, type Result, fail, ok } from '@vybekiit/core';
import type { DataProvider, DbRecord, QueryFilter } from '../../types';

/**
 * Build the AWS DynamoDB {@link DataProvider} — the opt-in key-value backend a buyer
 * selects with `DATA_PROVIDER=aws` (ADR-0002).
 *
 * Table requirement: each "collection" maps to a DynamoDB table whose partition key
 * is a string attribute named `id` (the agent's save-data skill creates tables with
 * an `id` HASH key). `AWS_DYNAMODB_TABLE_PREFIX` optionally namespaces table names.
 *
 * Credentials: `AWS_REGION` is always required. If both `AWS_ACCESS_KEY_ID` and
 * `AWS_SECRET_ACCESS_KEY` are present we pass them explicitly; otherwise we leave
 * `credentials` unset so the SDK's default credential chain (instance role, shared
 * config, env vars) applies — the normal path when deployed on AWS infra.
 *
 * One {@link DynamoDBDocumentClient} is constructed here and reused; the DocumentClient
 * marshals plain records, so method bodies never touch raw AttributeValue typing.
 * Each method maps a thrown SDK error into a {@link Result} failure with the same
 * stable codes the Supabase adapter uses.
 */
export function createAwsDataProvider(config: AwsConfig): DataProvider {
  const hasExplicitCredentials =
    config.AWS_ACCESS_KEY_ID !== undefined && config.AWS_SECRET_ACCESS_KEY !== undefined;

  const base = new DynamoDBClient({
    region: config.AWS_REGION,
    ...(hasExplicitCredentials
      ? {
          credentials: {
            // Narrowed to non-null by `hasExplicitCredentials`.
            accessKeyId: config.AWS_ACCESS_KEY_ID as string,
            secretAccessKey: config.AWS_SECRET_ACCESS_KEY as string,
          },
        }
      : {}),
  });
  const docClient = DynamoDBDocumentClient.from(base);

  /** Resolve a collection name to its (optionally prefixed) DynamoDB table name. */
  const tableName = (collection: string): string =>
    `${config.AWS_DYNAMODB_TABLE_PREFIX}${collection}`;

  return {
    name: 'aws',

    async insert<T extends DbRecord>(collection: string, record: T): Promise<Result<T>> {
      try {
        await docClient.send(new PutCommand({ TableName: tableName(collection), Item: record }));
        return ok(record);
      } catch (error) {
        return fail('db_insert_failed', errorMessage(error));
      }
    },

    async get<T extends DbRecord>(collection: string, id: string): Promise<Result<T | null>> {
      try {
        const { Item } = await docClient.send(
          new GetCommand({ TableName: tableName(collection), Key: { id } }),
        );
        // DocumentClient returns an unmarshalled record; narrow it to `T` at this
        // boundary the same way the Supabase adapter does for DB-result rows.
        return ok((Item as T | undefined) ?? null);
      } catch (error) {
        return fail('db_get_failed', errorMessage(error));
      }
    },

    async query<T extends DbRecord>(
      collection: string,
      filter: QueryFilter<T>,
    ): Promise<Result<T[]>> {
      try {
        // v1 uses Scan with a built FilterExpression for arbitrary-field equality:
        // simple and correct, but not index-optimized (it reads the whole table).
        // A by-id lookup uses GetCommand instead. Richer querying is out of scope.
        const { Items } = await docClient.send(
          new ScanCommand({ TableName: tableName(collection), ...buildScanFilter(filter) }),
        );
        return ok((Items as T[] | undefined) ?? []);
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
        const { Attributes } = await docClient.send(
          new UpdateCommand({
            TableName: tableName(collection),
            Key: { id },
            ReturnValues: 'ALL_NEW',
            ...buildUpdateExpression(patch),
          }),
        );
        return ok(Attributes as T);
      } catch (error) {
        return fail('db_update_failed', errorMessage(error));
      }
    },

    async remove(collection: string, id: string): Promise<Result<true>> {
      try {
        await docClient.send(new DeleteCommand({ TableName: tableName(collection), Key: { id } }));
        return ok(true);
      } catch (error) {
        return fail('db_remove_failed', errorMessage(error));
      }
    },
  };
}

/**
 * The Scan inputs derived from an equality {@link QueryFilter}.
 *
 * Field names go through `ExpressionAttributeNames` (`#k0`, `#k1`, …) and values
 * through `ExpressionAttributeValues` (`:v0`, …) so a filtered field that happens to
 * be a DynamoDB reserved word (e.g. `status`, `name`) never breaks the expression.
 * An empty filter yields an empty object — a bare Scan that returns every item.
 */
interface ScanFilterInput {
  FilterExpression?: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
}

/** Turn an equality filter into a DynamoDB Scan FilterExpression (AND of `=`). */
function buildScanFilter(filter: Record<string, unknown>): ScanFilterInput {
  const entries = Object.entries(filter);
  if (entries.length === 0) return {};

  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const clauses = entries.map(([field, value], index) => {
    names[`#k${index}`] = field;
    values[`:v${index}`] = value;
    return `#k${index} = :v${index}`;
  });

  return {
    FilterExpression: clauses.join(' AND '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };
}

/**
 * The Update inputs derived from a patch.
 *
 * Builds a `SET` expression with the same reserved-word-safe name/value aliasing as
 * {@link buildScanFilter}, so patching a field like `status` is safe.
 */
interface UpdateExpressionInput {
  UpdateExpression: string;
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, unknown>;
}

/** Turn a patch object into a DynamoDB `SET a = b, c = d` UpdateExpression. */
function buildUpdateExpression(patch: Record<string, unknown>): UpdateExpressionInput {
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const assignments = Object.entries(patch).map(([field, value], index) => {
    names[`#k${index}`] = field;
    values[`:v${index}`] = value;
    return `#k${index} = :v${index}`;
  });

  return {
    UpdateExpression: `SET ${assignments.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
  };
}

/** Narrow an unknown caught value to a developer-facing message string. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown DynamoDB error';
}
