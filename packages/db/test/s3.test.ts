import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createS3StorageProvider } from '../src/providers/s3';

/**
 * `vi.mock` is hoisted above imports, so its factory's refs must be hoisted too. Each
 * fake Command tags itself with its name and captures `input`, letting a test assert
 * both the command the adapter chose and the exact payload, while `send` is stubbed
 * per case.
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
      PutObjectCommand: make('PutObject'),
      DeleteObjectCommand: make('DeleteObject'),
    },
  };
});

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = send;
  },
  ...command,
}));

/** The single command issued to `send`, with its tag and payload typed for assertions. */
function sentCommand(): { name: string; input: Record<string, unknown> } {
  return send.mock.calls[0]?.[0];
}

const config = { AWS_REGION: 'us-east-1', AWS_DYNAMODB_TABLE_PREFIX: '' };
const run = Effect.runPromise;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createS3StorageProvider', () => {
  it('reports its provider name', () => {
    expect(createS3StorageProvider(config).name).toBe('s3');
  });

  it('upload issues a PutObjectCommand with bucket/key/body/content-type', async () => {
    send.mockResolvedValue({});
    const body = new Uint8Array([1, 2, 3]);

    const value = await run(
      createS3StorageProvider(config).upload('assets', 'logo.png', body, 'image/png'),
    );

    expect(sentCommand().name).toBe('PutObject');
    expect(sentCommand().input).toEqual({
      Bucket: 'assets',
      Key: 'logo.png',
      Body: body,
      ContentType: 'image/png',
    });
    expect(value).toEqual({ key: 'logo.png' });
  });

  it('upload omits ContentType when none is given', async () => {
    send.mockResolvedValue({});
    await run(createS3StorageProvider(config).upload('assets', 'raw.bin', new Uint8Array([0])));
    expect(sentCommand().input).not.toHaveProperty('ContentType');
  });

  it('upload maps an SDK error to fail("storage_upload_failed")', async () => {
    send.mockRejectedValue(new Error('access denied'));
    const error = await run(
      Effect.flip(
        createS3StorageProvider(config).upload('assets', 'logo.png', new Uint8Array([1])),
      ),
    );
    expect(error.code).toBe('storage_upload_failed');
    expect(error.message).toBe('access denied');
  });

  it('getUrl returns the virtual-hosted public URL without calling send', async () => {
    const value = await run(createS3StorageProvider(config).getUrl('assets', 'logo.png'));
    expect(value.url).toBe('https://assets.s3.us-east-1.amazonaws.com/logo.png');
    expect(send).not.toHaveBeenCalled();
  });

  it('remove issues a DeleteObjectCommand and returns true', async () => {
    send.mockResolvedValue({});

    const value = await run(createS3StorageProvider(config).remove('assets', 'logo.png'));

    expect(sentCommand().name).toBe('DeleteObject');
    expect(sentCommand().input).toEqual({ Bucket: 'assets', Key: 'logo.png' });
    expect(value).toBe(true);
  });

  it('remove maps an SDK error to fail("storage_remove_failed")', async () => {
    send.mockRejectedValue(new Error('no such key'));
    const error = await run(
      Effect.flip(createS3StorageProvider(config).remove('assets', 'gone.png')),
    );
    expect(error.code).toBe('storage_remove_failed');
  });
});
