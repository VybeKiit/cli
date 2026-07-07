/**
 * Create an async text stream that yields exactly one chunk.
 *
 * @param text - Text value yielded by the returned async iterable.
 * @returns An AsyncIterable that yields `text` once and then completes.
 * @example
 * const chunks = await Array.fromAsync(createSingleChunkStream('hello'));
 */
export const createSingleChunkStream = (text: string): AsyncIterable<string> => ({
  [Symbol.asyncIterator]: (): AsyncIterator<string> => {
    let hasYielded = false;

    return {
      next: (): Promise<IteratorResult<string>> => {
        if (hasYielded) {
          return Promise.resolve({ done: true, value: undefined });
        }

        hasYielded = true;
        return Promise.resolve({ done: false, value: text });
      },
    };
  },
});
