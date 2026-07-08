'use client';

import { InteractiveImageSlider } from '@/components/bundui/interactive-image-slider';

export default function InteractiveImageSliderPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <InteractiveImageSlider />
    </div>
  );
}
