'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@vybekiit/ui/empty';
import { Inbox } from 'lucide-react';

type EmptyVariant = 'default' | 'dashed' | 'compact';

/** The real Empty primitive with realistic zero-state copy and an action. */
const EmptySample = ({ variant }: { readonly variant: EmptyVariant }) => (
  <Empty variant={variant}>
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Inbox />
      </EmptyMedia>
      <EmptyTitle>No invoices yet</EmptyTitle>
      <EmptyDescription>New invoices show up here once you send your first one.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button size="sm" variant="outline">
        Create invoice
      </Button>
    </EmptyContent>
  </Empty>
);

const VARIANTS: readonly EmptyVariant[] = ['default', 'dashed', 'compact'];

/** Every Empty layout variant, laid out at once. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="grid w-full max-w-md gap-6">
      {VARIANTS.map((variant) => (
        <div className="space-y-2" key={variant}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {variant}
          </p>
          <EmptySample variant={variant} />
        </div>
      ))}
    </div>
  ),
};

export default story;
