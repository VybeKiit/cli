'use client';

import { Button } from '@vybekiit/ui/button';
import {
  Glimpse,
  GlimpseContent,
  GlimpseDescription,
  GlimpseTitle,
  GlimpseTrigger,
} from '@/components/kibo/glimpse';

export default function GlimpsePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center p-6">
      <Glimpse>
        <GlimpseTrigger asChild={true}>
          <Button type="button" variant="outline">
            Hover for glimpse
          </Button>
        </GlimpseTrigger>
        <GlimpseContent className="w-72">
          <GlimpseTitle>Kibo Glimpse</GlimpseTitle>
          <GlimpseDescription>
            A lightweight hover preview card built on top of the hover-card primitive.
          </GlimpseDescription>
        </GlimpseContent>
      </Glimpse>
    </div>
  );
}
