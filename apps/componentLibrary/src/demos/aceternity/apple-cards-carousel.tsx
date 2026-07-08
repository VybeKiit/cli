'use client';

import {
  BlurImage,
  Card,
  Carousel,
  CarouselContext,
} from '@/components/aceternity/ui/apple-cards-carousel';

export default function AppleCardsCarouselPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <CarouselContext />
      <Carousel />
      <Card />
      <BlurImage />
    </div>
  );
}
