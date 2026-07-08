/** Named size scale for builder assistant marks — matches gallery preview sizing. */
export type BuilderAssistantMarkSize = 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';

export const BUILDER_ASSISTANT_MARK_SIZES: readonly BuilderAssistantMarkSize[] = [
  'xs',
  's',
  'm',
  'l',
  'xl',
  'xxl',
] as const;

export const BUILDER_ASSISTANT_MARK_SIZE_LABELS: Record<BuilderAssistantMarkSize, string> = {
  xs: 'XS · 12px',
  s: 'S · 18px',
  m: 'M · 24px',
  l: 'L · 32px',
  xl: 'XL · 48px',
  xxl: 'XXL · 72px',
};

/**
 * Resolve the CSS class for a named assistant mark size.
 *
 * @param size - Size token from the assistant mark scale.
 * @returns CSS modifier class for the requested size.
 * @example
 * builderAssistantMarkSizeClass('xl');
 */
export const builderAssistantMarkSizeClass = (size: BuilderAssistantMarkSize = 's'): string =>
  `builder-assistant-mark--size-${size}`;
