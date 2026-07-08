'use client';

import { ImagesSlider } from '@/components/aceternity/images-slider';

export default function ImagesSliderPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ImagesSlider>
        <span className="text-sm text-muted-foreground">Preview</span>
      </ImagesSlider>
    </div>
  );
}
