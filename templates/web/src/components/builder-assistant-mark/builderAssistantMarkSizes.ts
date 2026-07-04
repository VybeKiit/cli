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

export function builderAssistantMarkSizeClass(size: BuilderAssistantMarkSize = 's'): string {
  return `builder-assistant-mark--size-${size}`;
}
