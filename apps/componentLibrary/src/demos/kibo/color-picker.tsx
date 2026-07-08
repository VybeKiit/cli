'use client';

import { ColorPicker } from '@/components/kibo/color-picker/index';

export default function ColorPickerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ColorPicker />
    </div>
  );
}
