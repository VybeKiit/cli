'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@vybekiit/ui/dropdown-menu';
import { Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

/** A real, openable DropdownMenu with label, items, separator, and a checkbox item. */
const DropdownDemo = () => {
  const [showTimestamps, setShowTimestamps] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild={true}>
        <Button variant="outline">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>File actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Pencil />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download />
          Export
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showTimestamps} onCheckedChange={setShowTimestamps}>
          Show timestamps
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <Trash2 />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/** Openable DropdownMenu with label, items, separator, and a stateful checkbox item. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <DropdownDemo />
      </div>
    </div>
  ),
};

export default story;
