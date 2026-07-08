'use client';

import { SelectContext } from '@/components/untitled/select/select-shared';

export default function SelectSharedPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <SelectContext />
    </div>
  );
}
