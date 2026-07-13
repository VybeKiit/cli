'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@vybekiit/ui/sheet';
import { useId } from 'react';

/** A real Sheet — right-side panel with header, a labelled field, and a footer action. */
const SheetDemo = ({ side }: { readonly side: 'right' | 'left' | 'top' | 'bottom' }) => {
  const inputId = useId();
  return (
    <Sheet>
      <SheetTrigger asChild={true}>
        <Button variant="outline">Open {side}</Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>
            Make changes to your profile here. Click save when done.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-medium text-sm" htmlFor={inputId}>
              Display name
            </label>
            <input
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              defaultValue="Yosef Hayim"
              id={inputId}
              type="text"
            />
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

/** SheetContent in all four sides — each trigger opens its own real overlay. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap gap-4">
      {(['right', 'left', 'top', 'bottom'] as const).map((side) => (
        <div className="flex flex-col items-start gap-2" key={side}>
          <span className="font-medium text-muted-foreground text-xs capitalize">{side}</span>
          <SheetDemo side={side} />
        </div>
      ))}
    </div>
  ),
};

export default story;
