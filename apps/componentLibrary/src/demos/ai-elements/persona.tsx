'use client';

import { Persona } from '@/components/ai-elements/persona';

export default function PersonaPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Persona>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Persona>
    </div>
  );
}
