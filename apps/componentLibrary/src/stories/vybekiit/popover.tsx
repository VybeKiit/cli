'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@vybekiit/ui/popover';
import { useId } from 'react';

/** A real, openable Popover with a form-style content panel. */
const PopoverDemo = () => {
  const nameId = useId();
  const emailId = useId();

  return (
    <Popover>
      <PopoverTrigger asChild={true}>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-3">
          <p className="font-semibold text-sm">Update profile</p>
          <p className="text-muted-foreground text-xs">
            Make changes to your profile here. Click outside to close.
          </p>
          <div className="space-y-1">
            <label className="font-medium text-xs" htmlFor={nameId}>
              Display name
            </label>
            <input
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              defaultValue="Ada Lovelace"
              id={nameId}
              type="text"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-xs" htmlFor={emailId}>
              Email
            </label>
            <input
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              defaultValue="ada@example.com"
              id={emailId}
              type="email"
            />
          </div>
          <Button className="w-full" size="sm">
            Save changes
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/** Openable Popover with a small form inside — click the trigger button to open. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <div className="flex flex-col items-start gap-2">
        <span className="font-medium text-muted-foreground text-xs">Default</span>
        <PopoverDemo />
      </div>
    </div>
  ),
};

export default story;
