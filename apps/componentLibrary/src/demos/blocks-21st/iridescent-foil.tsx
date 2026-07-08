'use client';

import { IridescentFoil } from '@/components/blocks/21st/iridescent-foil';

export default function IridescentFoilPreview() {
  return (
    <div className="flex min-h-[280px] items-center justify-center p-8">
      <IridescentFoil className="rounded-2xl px-10 py-8 text-2xl font-bold">
        Iridescent foil
      </IridescentFoil>
    </div>
  );
}
