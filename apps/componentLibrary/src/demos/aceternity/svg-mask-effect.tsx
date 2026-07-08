'use client';

import { MaskContainer } from '@/components/aceternity/svg-mask-effect';

export default function SvgMaskEffectPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <MaskContainer />
    </div>
  );
}
