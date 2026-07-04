'use client';

import { LayoutTooltip } from '@library/components/layout/LayoutTooltip';
import { saveInfiniteScrollEnabled } from '@library/lib/catalogScrollMode';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CatalogScrollModeToggleProps {
  readonly enabled: boolean;
  readonly onEnabledChange: (enabled: boolean) => void;
}

export function CatalogScrollModeToggle({
  enabled,
  onEnabledChange,
}: CatalogScrollModeToggleProps) {
  return (
    <LayoutTooltip label="When on, more cards load as you scroll. When off, browse fixed pages with controls at the bottom.">
      <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
        <Switch
          aria-label="Infinite scroll"
          checked={enabled}
          id="catalog-infinite-scroll"
          onCheckedChange={(next) => {
            onEnabledChange(next);
            saveInfiniteScrollEnabled(next);
          }}
        />
        <Label className="cursor-pointer text-sm" htmlFor="catalog-infinite-scroll">
          Infinite scroll
        </Label>
      </div>
    </LayoutTooltip>
  );
}
