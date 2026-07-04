'use client';

import { HookForm } from '@/components/untitled/form/hook-form';

export default function HookFormPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <HookForm>
        <span className="text-sm text-muted-foreground">Preview</span>
      </HookForm>
    </div>
  );
}
