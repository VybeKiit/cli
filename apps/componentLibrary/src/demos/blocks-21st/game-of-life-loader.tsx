'use client';

import { GameOfLifeLoader } from '@/components/blocks/21st/game-of-life-loader';

export default function GameOfLifeLoaderPreview() {
  return (
    <div className="flex min-h-[280px] items-center justify-center p-6">
      <GameOfLifeLoader className="h-32 w-32" />
    </div>
  );
}
