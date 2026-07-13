'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import { Button } from '@vybekiit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@vybekiit/ui/card';

/** A realistic Card composed from every slot. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Upgrade to Pro</CardTitle>
        <CardDescription>Unlock unlimited projects and priority support.</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground text-sm">
        Everything in Free, plus custom domains, analytics, and unlimited team seats.
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button size="sm" variant="ghost">
          Maybe later
        </Button>
        <Button size="sm">Upgrade</Button>
      </CardFooter>
    </Card>
  ),
};

export default story;
