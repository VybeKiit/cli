const MAX_CONCURRENT_LOADS = 2;

let activeLoads = 0;
const waitQueue: Array<() => void> = [];

/** Limit how many embed iframes compile at once — keeps the catalog scrollable. */
export function acquirePreviewLoadSlot(): Promise<() => void> {
  return new Promise((resolve) => {
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
}
