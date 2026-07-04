'use client';

import { TextFlippingBoard } from '@/components/aceternity/text-flipping-board';

export default function TextFlippingBoardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <TextFlippingBoard />
    </div>
  );
}
