'use client';

import { Keyboard } from '@/components/aceternity/keyboard';

export default function KeyboardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Keyboard>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Keyboard>
    </div>
  );
}
