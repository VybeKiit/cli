'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@vybekiit/ui/alert-dialog';
import { Button } from '@vybekiit/ui/button';

/** Destructive confirmation AlertDialog — trigger opens the real modal overlay. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col items-start gap-2">
      <span className="font-medium text-muted-foreground text-xs">Destructive</span>
      <AlertDialog>
        <AlertDialogTrigger asChild={true}>
          <Button variant="destructive">Delete account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all
              your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Delete account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  ),
};

export default story;
