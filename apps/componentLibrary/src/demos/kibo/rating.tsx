'use client';

import { Rating } from '@/components/kibo/rating/index';

export default function RatingPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Rating />
    </div>
  );
}
