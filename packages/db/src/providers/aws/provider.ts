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
import type { AwsConfig } from '@vybekiit/core';
import { tryDb } from '@vybekiit/db/providerEffect';
import { MINIMAL_CAPABILITIES } from '@vybekiit/db/providers/postgres/shared';
import type { DataProvider, DbRecord, QueryFilter } from '@vybekiit/db/types';

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
 * Each method maps a thrown SDK error into a tagged DB failure with the same stable
 * codes the Supabase adapter uses.
 *
 * @param config - Validated AWS config.
 * @returns Data provider backed by DynamoDB.
 * @example
 * const provider = createAwsDataProvider(config);
 */
export const createAwsDataProvider =
  // biome-ignore lint/complexity/noExcessiveLinesPerFunction: Adapter methods stay colocated with shared SDK client state.
  (config: AwsConfig): DataProvider => {
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
      capabilities: MINIMAL_CAPABILITIES,

      insert: <T extends DbRecord>(collection: string, record: T) =>
        tryDb(
          'db_insert_failed',
          async () => {
            await docClient.send(
              new PutCommand({ TableName: tableName(collection), Item: record }),
            );
            return record;
          },
          'unknown DynamoDB error',
        ),

      get: <T extends DbRecord>(collection: string, id: string) =>
        tryDb(
          'db_get_failed',
          async () => {
            const { Item } = await docClient.send(
              new GetCommand({ TableName: tableName(collection), Key: { id } }),
            );
            // DocumentClient returns an unmarshalled record; narrow it to `T` at this
            // boundary the same way the Supabase adapter does for DB-result rows.
            if (Item === undefined) {
              return null;
            }
            return Item as T;
          },
          'unknown DynamoDB error',
        ),

      query: <T extends DbRecord>(collection: string, filter: QueryFilter<T>) =>
        tryDb(
          'db_query_failed',
          async () => {
            // v1 uses Scan with a built FilterExpression for arbitrary-field equality:
            // simple and correct, but not index-optimized (it reads the whole table).
            // A by-id lookup uses GetCommand instead. Richer querying is out of scope.
            const { Items } = await docClient.send(
              new ScanCommand({ TableName: tableName(collection), ...buildScanFilter(filter) }),
            );
            if (Items === undefined) {
              return [];
            }
            return Items as T[];
          },
          'unknown DynamoDB error',
        ),

      update: <T extends DbRecord>(collection: string, id: string, patch: Partial<Omit<T, 'id'>>) =>
        tryDb(
          'db_update_failed',
          async () => {
            const { Attributes } = await docClient.send(
              new UpdateCommand({
                TableName: tableName(collection),
                Key: { id },
                ReturnValues: 'ALL_NEW',
                ...buildUpdateExpression(patch),
              }),
            );
            return Attributes as T;
          },
          'unknown DynamoDB error',
        ),

      remove: (collection: string, id: string) =>
        tryDb(
          'db_remove_failed',
          async () => {
            await docClient.send(
              new DeleteCommand({ TableName: tableName(collection), Key: { id } }),
            );
            return true as const;
          },
          'unknown DynamoDB error',
        ),
    };
  };

/**
 * The Scan inputs derived from an equality {@link QueryFilter}.
 *
 * Field names go through `ExpressionAttributeNames` (`#k0`, `#k1`, …) and values
 * through `ExpressionAttributeValues` (`:v0`, …) so a filtered field that happens to
 * be a DynamoDB reserved word (e.g. `status`, `name`) never breaks the expression.
 * An empty filter yields an empty object — a bare Scan that returns every item.
 */
type ScanFilterInput = {
  readonly FilterExpression?: string;
  readonly ExpressionAttributeNames?: Record<string, string>;
  readonly ExpressionAttributeValues?: Record<string, unknown>;
};

/**
 * Turn an equality filter into a DynamoDB Scan FilterExpression.
 *
 * @param filter - Equality filter fields.
 * @returns Scan input expression fragments.
 * @example
 * const input = buildScanFilter({ status: 'paid' });
 */
const buildScanFilter = (filter: Record<string, unknown>): ScanFilterInput => {
  const entries = Object.entries(filter);
  if (entries.length === 0) {
    return {};
  }

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
};

/**
 * The Update inputs derived from a patch.
 *
 * Builds a `SET` expression with the same reserved-word-safe name/value aliasing as
 * {@link buildScanFilter}, so patching a field like `status` is safe.
 */
type UpdateExpressionInput = {
  readonly UpdateExpression: string;
  readonly ExpressionAttributeNames: Record<string, string>;
  readonly ExpressionAttributeValues: Record<string, unknown>;
};

/**
 * Turn a patch object into a DynamoDB update expression.
 *
 * @param patch - Fields to update.
 * @returns Update input expression fragments.
 * @example
 * const input = buildUpdateExpression({ status: 'paid' });
 */
const buildUpdateExpression = (patch: Record<string, unknown>): UpdateExpressionInput => {
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
};
