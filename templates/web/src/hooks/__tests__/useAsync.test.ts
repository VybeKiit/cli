import { useAsync } from '@/hooks/useAsync';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Effect, type Either } from 'effect';

class TestError {
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}

describe('useAsync success state', () => {
  it('toggles loading around a run and stores the ok value', async () => {
    // A deferred promise lets us observe `loading: true` mid-flight, then false.
    let resolveRun: (result: number) => void = () => undefined;
    const pending = new Promise<number>((resolve) => {
      resolveRun = resolve;
    });
    const { result } = renderHook(() => useAsync(() => Effect.promise(() => pending)));

    expect(result.current.loading).toBe(false);

    let runPromise: Promise<Either.Either<number, TestError>>;
    act(() => {
      runPromise = result.current.run();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveRun(42);
      await runPromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });
});

describe('useAsync error state', () => {
  it('populates error with the failure message on err', async () => {
    const reject = () => Effect.fail(new TestError('It did not work.'));
    const { result } = renderHook(() => useAsync(reject));

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBe('It did not work.');
    expect(result.current.data).toBeNull();
  });

  it('clears a previous error when a later run succeeds', async () => {
    const calls: Effect.Effect<number, TestError>[] = [
      Effect.fail(new TestError('First failed.')),
      Effect.succeed(7),
    ];
    const next = (): Effect.Effect<number, TestError> => {
      const response = calls.shift();
      if (response === undefined) {
        throw new Error('Expected a queued useAsync result.');
      }
      return response;
    };
    const { result } = renderHook(() => useAsync(next));

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBe('First failed.');

    await act(async () => {
      await result.current.run();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBe(7);
  });
});
