import { useAsync } from '@/hooks/useAsync';
import { act, renderHook, waitFor } from '@testing-library/react';
import { type Result, fail, ok } from '@vybekiit/core';

describe('useAsync', () => {
  it('toggles loading around a run and stores the ok value', async () => {
    // A deferred promise lets us observe `loading: true` mid-flight, then false.
    let resolveRun: (result: Result<number>) => void = () => {};
    const pending = new Promise<Result<number>>((resolve) => {
      resolveRun = resolve;
    });
    const { result } = renderHook(() => useAsync(() => pending));

    expect(result.current.loading).toBe(false);

    let runPromise: Promise<Result<number>>;
    act(() => {
      runPromise = result.current.run();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(async () => {
      resolveRun(ok(42));
      await runPromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBe(42);
    expect(result.current.error).toBeNull();
  });

  it('populates error with the failure message on err', async () => {
    const reject = (): Promise<Result<number>> => Promise.resolve(fail('boom', 'It did not work.'));
    const { result } = renderHook(() => useAsync(reject));

    await act(async () => {
      await result.current.run();
    });

    expect(result.current.error).toBe('It did not work.');
    expect(result.current.data).toBeNull();
  });

  it('clears a previous error when a later run succeeds', async () => {
    const calls: Array<Result<number>> = [fail('boom', 'First failed.'), ok(7)];
    const next = (): Promise<Result<number>> => Promise.resolve(calls.shift() ?? ok(0));
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
