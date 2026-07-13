'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@vybekiit/ui/context-menu';
import { Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';

/** A real ContextMenu — right-click the dashed box to open the menu. */
const ContextMenuDemo = () => (
  <ContextMenu>
    <ContextMenuTrigger>
      <div className="flex h-32 w-64 items-center justify-center rounded-md border border-dashed border-border">
        <span className="select-none text-muted-foreground text-sm">Right-click here</span>
      </div>
    </ContextMenuTrigger>
    <ContextMenuContent className="w-48">
      <ContextMenuLabel>Actions</ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuItem>
        <Pencil />
        Edit
      </ContextMenuItem>
      <ContextMenuItem>
        <Copy />
        Copy link
      </ContextMenuItem>
      <ContextMenuItem>
        <ExternalLink />
        Open in new tab
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem className="text-destructive focus:text-destructive">
        <Trash2 />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);

/** ContextMenu triggered by right-clicking a dashed target box; shows label, items, and separator. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <ContextMenuDemo />
      </div>
    </div>
  ),
};

export default story;
