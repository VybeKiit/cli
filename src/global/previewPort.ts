import { createServer } from 'node:net';
import { Data, Effect } from 'effect';

export class PreviewPortError extends Data.TaggedError('PreviewPortError')<{
  readonly message: string;
}> {}

export const choosePreviewPort = Effect.async<number, PreviewPortError>((resume) => {
  const listener = createServer();
  listener.once('error', () =>
    resume(
      Effect.fail(
        new PreviewPortError({
          message: 'Could not reserve a port for your app preview.',
        }),
      ),
    ),
  );
  listener.listen(0, '127.0.0.1', () => {
    const address = listener.address();
    if (address === null || typeof address === 'string') {
      listener.close();
      resume(Effect.fail(new PreviewPortError({ message: 'The preview port is unavailable.' })));
      return;
    }
    listener.close(() => resume(Effect.succeed(address.port)));
  });
  return Effect.sync(() => {
    listener.close();
  });
});
