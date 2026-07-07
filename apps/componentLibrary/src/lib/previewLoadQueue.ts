const MAX_CONCURRENT_LOADS = 2;

let activeLoads = 0;
const waitQueue: Array<() => void> = [];

/**
 * Acquire preview load slot.
 *
 * @returns The value produced by acquirePreviewLoadSlot.
 * @example
 * const result = acquirePreviewLoadSlot();
 */
export const acquirePreviewLoadSlot = (): Promise<() => void> =>
  new Promise((resolve) => {
    const grant = () => {
      activeLoads += 1;
      let released = false;
      resolve(() => {
        if (released) {
          return;
        }
        released = true;
        activeLoads = Math.max(0, activeLoads - 1);
        waitQueue.shift()?.();
      });
    };

    if (activeLoads < MAX_CONCURRENT_LOADS) {
      grant();
      return;
    }

    waitQueue.push(grant);
  });
