'use client';

import type { PrimitiveStoryModule } from '@library/lib/primitiveStory';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@vybekiit/ui/carousel';

const SLIDES = [1, 2, 3, 4, 5] as const;

/** Horizontal Carousel with 5 numbered slides, prev/next controls. */
export const story: PrimitiveStoryModule = {
  ShowAll: () => (
    <div className="flex flex-col items-center gap-6 px-16 w-full">
      <div className="flex flex-col items-center gap-2 w-full">
        <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide self-start">
          Horizontal carousel
        </span>
        <Carousel className="w-full max-w-xs">
          <CarouselContent>
            {SLIDES.map((n) => (
              <CarouselItem key={n}>
                <div className="flex aspect-square items-center justify-center rounded-md border bg-muted p-6">
                  <span className="text-5xl font-semibold text-muted-foreground">{n}</span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  ),
};

export default story;
