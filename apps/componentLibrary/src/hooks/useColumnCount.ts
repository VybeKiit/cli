'use client';

import { useMemo } from 'react';

/**
 * Infer the virtualizer column count from a Tailwind grid class string.
 *
 * @param gridClassName - Catalog grid layout classes (e.g. `md:grid-cols-3`).
 * @returns Column count used for row chunking (1–6).
 * @example
 * const columns = useColumnCount('md:grid-cols-2 xl:grid-cols-4');
 */
export const useColumnCount = (gridClassName: string): number =>
  useMemo(() => {
    if (gridClassName.includes('grid-cols-6')) {
      return 6;
    }
    if (gridClassName.includes('2xl:grid-cols-5') || gridClassName.includes('xl:grid-cols-5')) {
      return 5;
    }
    if (gridClassName.includes('2xl:grid-cols-4') || gridClassName.includes('xl:grid-cols-4')) {
      return 4;
    }
    if (gridClassName.includes('lg:grid-cols-3') || gridClassName.includes('md:grid-cols-3')) {
      return 3;
    }
    if (gridClassName.includes('md:grid-cols-2') || gridClassName.includes('sm:grid-cols-2')) {
      return 2;
    }
    return 1;
  }, [gridClassName]);
