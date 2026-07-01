import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAwsDataProvider } from '../src/providers/aws';

/**
 * `vi.mock` is hoisted above imports, so anything its factory references must be
 * hoisted too — hence `vi.hoisted`. Each fake Command tags itself with the
 * originating command name and captures its `input`, letting a test assert both the
 * command the adapter chose and the exact payload, while `send` is stubbed per case.
 */
const { send, command } = vi.hoisted(() => {
  const make = (name: string) =>
    class {
      readonly name = name;
      constructor(public readonly input: Record<string, unknown>) {}
    };
  return {
    send: vi.fn(),
    command: {
      PutCommand: make('Put'),
      GetCommand: make('Get'),
      ScanCommand: make('Scan'),
      UpdateCommand: make('Update'),
      DeleteCommand: make('Delete'),
    },
  };
});

vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send }) },
  ...command,
}));

/** The single command issued to `send`, with its tag and payload typed for assertions. */
function sentCommand(): { name: string; input: Record<string, unknown> } {
  return send.mock.calls[0]?.[0];
}

const config = { AWS_REGION: 'us-east-1', AWS_DYNAMODB_TABLE_PREFIX: '' };
const run = Effect.runPromise;

interface Order {
  readonly id: string;
  email: string;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createAwsDataProvider', () => {
  it('reports its provider name', () => {
    expect(createAwsDataProvider(config).name).toBe('aws');
  });

  it('insert issues a PutCommand and returns the record', async () => {
    send.mockResolvedValue({});
    const order: Order = { id: 'o1', email: 'a@b.c' };

    const value = await run(createAwsDataProvider(config).insert('orders', order));

    expect(sentCommand().name).toBe('Put');
    expect(sentCommand().input).toEqual({ TableName: 'orders', Item: order });
    expect(value).toEqual(order);
  });

  it('applies the table prefix to the table name', async () => {
    send.mockResolvedValue({});
    await run(
      createAwsDataProvider({ ...config, AWS_DYNAMODB_TABLE_PREFIX: 'prod_' }).insert('orders', {
        id: 'o1',
        email: 'a@b.c',
      }),
    );
    expect(sentCommand().input.TableName).toBe('prod_orders');
  });

  it('get issues a GetCommand keyed by id and unwraps Item', async () => {
    send.mockResolvedValue({ Item: { id: 'o1', email: 'a@b.c' } });

    const value = await run(createAwsDataProvider(config).get<Order>('orders', 'o1'));

    expect(sentCommand().name).toBe('Get');
    expect(sentCommand().input).toEqual({ TableName: 'orders', Key: { id: 'o1' } });
    expect(value).toEqual({ id: 'o1', email: 'a@b.c' });
  });

  it('get returns null when DynamoDB has no Item', async () => {
    send.mockResolvedValue({});
    const value = await run(createAwsDataProvider(config).get<Order>('orders', 'missing'));
    expect(value).toBeNull();
  });

  it('get maps an SDK error to fail("db_get_failed")', async () => {
    send.mockRejectedValue(new Error('throttled'));
    const error = await run(Effect.flip(createAwsDataProvider(config).get<Order>('orders', 'o1')));
    expect(error.code).toBe('db_get_failed');
    expect(error.message).toBe('throttled');
  });

  it('query issues a ScanCommand with a reserved-word-safe FilterExpression', async () => {
    send.mockResolvedValue({ Items: [{ id: 'o1', email: 'a@b.c' }] });

    const value = await run(
      createAwsDataProvider(config).query<Order>('orders', { email: 'a@b.c' }),
    );

    expect(sentCommand().name).toBe('Scan');
    expect(sentCommand().input).toEqual({
      TableName: 'orders',
      FilterExpression: '#k0 = :v0',
      ExpressionAttributeNames: { '#k0': 'email' },
      ExpressionAttributeValues: { ':v0': 'a@b.c' },
    });
    expect(value).toEqual([{ id: 'o1', email: 'a@b.c' }]);
  });

  it('query with an empty filter scans the whole table', async () => {
    send.mockResolvedValue({ Items: [] });
    await run(createAwsDataProvider(config).query<Order>('orders', {}));
    expect(sentCommand().input).toEqual({ TableName: 'orders' });
  });

  it('update issues an UpdateCommand with a SET expression and ALL_NEW', async () => {
    send.mockResolvedValue({ Attributes: { id: 'o1', email: 'new@b.c' } });

    const value = await run(
      createAwsDataProvider(config).update<Order>('orders', 'o1', { email: 'new@b.c' }),
    );

    expect(sentCommand().name).toBe('Update');
    expect(sentCommand().input).toEqual({
      TableName: 'orders',
      Key: { id: 'o1' },
      ReturnValues: 'ALL_NEW',
      UpdateExpression: 'SET #k0 = :v0',
      ExpressionAttributeNames: { '#k0': 'email' },
      ExpressionAttributeValues: { ':v0': 'new@b.c' },
    });
    expect(value).toEqual({ id: 'o1', email: 'new@b.c' });
  });

  it('remove issues a DeleteCommand and returns true', async () => {
    send.mockResolvedValue({});

    const value = await run(createAwsDataProvider(config).remove('orders', 'o1'));

    expect(sentCommand().name).toBe('Delete');
    expect(sentCommand().input).toEqual({ TableName: 'orders', Key: { id: 'o1' } });
    expect(value).toBe(true);
  });
});
