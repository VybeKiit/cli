import { PAGE_RECIPE_GROUP_SUMMARIES } from '@library/lib/pageRecipeGroupSummaries';

/**
 * Normalize a Pages `?group=` query into a known group id.
 *
 * @param groupId - Raw query value (may be missing or unknown).
 * @returns A known group id, or `all` when invalid.
 * @example
 * safeInitialGroupId('payments'); // "payments" when that group exists
 * safeInitialGroupId('nope'); // "all"
 */
export const safeInitialGroupId = (groupId: string | undefined): string => {
  if (groupId !== undefined && PAGE_RECIPE_GROUP_SUMMARIES.some((group) => group.id === groupId)) {
    return groupId;
  }
  return 'all';
};
