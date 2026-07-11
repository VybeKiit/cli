export type CommandGroup = 'navigation' | 'create' | 'ops' | 'help';

/** One runnable command in the palette. */
export type CommandItem = {
  readonly id: string;
  readonly label: string;
  readonly group: CommandGroup;
  readonly shortcut?: string;
  readonly keywords: readonly string[];
  readonly pinned?: boolean;
};
