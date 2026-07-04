'use client';

import { useState } from 'react';
import { Component as AppleColorPicker } from '@/components/blocks/21st/apple-color-picker';

export default function AppleColorPickerPreview() {
  const [open, setOpen] = useState(true);
  const [color, setColor] = useState('#007AFF');

  return (
    <div className="relative flex min-h-[360px] items-center justify-center p-6">
      <button
        type="button"
        className="rounded-lg border px-4 py-2 text-sm"
        onClick={() => setOpen(true)}
      >
        Open picker ({color})
      </button>
      <AppleColorPicker
        initialColor={color}
        isOpen={open}
        onChange={setColor}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
