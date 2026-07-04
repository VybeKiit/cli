'use client';

import { Deck } from '@/components/kibo/deck/index';

export default function DeckPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Deck />
    </div>
  );
}
