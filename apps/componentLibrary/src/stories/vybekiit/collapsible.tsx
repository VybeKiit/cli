'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@vybekiit/ui/collapsible';
import { ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';

const REPOS = ['@radix-ui/primitives', '@radix-ui/colors', 'stitches'];

/** One collapsible panel with a chevron toggle and a short list inside. */
const CollapsibleDemo = ({
  label,
  defaultOpen,
}: {
  readonly label: string;
  readonly defaultOpen: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="flex flex-col gap-2">
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      <Collapsible className="w-56 space-y-2" onOpenChange={setOpen} open={open}>
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="font-semibold text-sm">@peduarte starred 3 repos</h4>
          <CollapsibleTrigger asChild={true}>
            <Button size="sm" variant="ghost">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">{REPOS[0]}</div>
        <CollapsibleContent className="space-y-2">
          {REPOS.slice(1).map((repo) => (
            <div className="rounded-md border px-4 py-3 font-mono text-sm" key={repo}>
              {repo}
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

/** Two Collapsible instances shown side by side — one open, one closed. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap gap-8">
      <CollapsibleDemo defaultOpen={true} label="Open" />
      <CollapsibleDemo defaultOpen={false} label="Closed" />
    </div>
  ),
};

export default story;
