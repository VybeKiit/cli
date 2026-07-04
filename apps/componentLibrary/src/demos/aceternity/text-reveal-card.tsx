'use client';

import { TextRevealCard } from '@/components/aceternity/ui/text-reveal-card';

export default function TextRevealCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <TextRevealCard>
        <span className="text-sm text-muted-foreground">Preview</span>
      </TextRevealCard>
    </div>
  );
}
