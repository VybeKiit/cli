/**
 * Build the Pages catalog href for a sidebar group chip.
 *
 * @param groupId - Group id, or `all` for the unfiltered catalog.
 * @returns Path (and optional query) under `/pages`.
 * @example
 * pageGroupHref('all'); // "/pages"
 * pageGroupHref('payments'); // "/pages?group=payments"
 */
export const pageGroupHref = (groupId: string): string =>
  groupId === 'all' ? '/pages' : `/pages?group=${groupId}`;
