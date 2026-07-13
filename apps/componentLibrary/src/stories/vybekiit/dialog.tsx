'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@vybekiit/ui/dialog';

type DialogTone = 'default' | 'destructive';

/** A real, openable Dialog — an informational invite and a destructive confirm. */
const ConfirmDialog = ({ tone }: { readonly tone: DialogTone }) => {
  const destructive = tone === 'destructive';
  return (
    <Dialog>
      <DialogTrigger asChild={true}>
        <Button variant={destructive ? 'destructive' : 'default'}>
          {destructive ? 'Delete project' : 'Invite teammate'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{destructive ? 'Delete this project?' : 'Invite a teammate'}</DialogTitle>
          <DialogDescription>
            {destructive
              ? 'This permanently removes the project and all of its data. This cannot be undone.'
              : 'They will receive an email invite to join your workspace.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild={true}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild={true}>
            <Button variant={destructive ? 'destructive' : 'default'}>
              {destructive ? 'Delete' : 'Send invite'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Both Dialog tones side by side — open them to see the real overlay. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ConfirmDialog tone="default" />
      <ConfirmDialog tone="destructive" />
    </div>
  ),
};

export default story;
