'use client';

import { TiltCard } from '@/components/blocks/21st/be-ui-tilt-card';

export default function BeUiTiltCardPreview() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-8">
      <TiltCard className="w-72 rounded-2xl border bg-card p-6 shadow-lg">
        <p className="text-sm font-medium text-muted-foreground">Tilt card</p>
        <h3 className="mt-2 text-xl font-semibold">Hover to tilt</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Move your pointer over this card to see the 3D tilt effect.
        </p>
      </TiltCard>
    </div>
  );
}
