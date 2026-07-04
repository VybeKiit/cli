'use client';

import { ListItems } from '@/components/kibo/list/index';

export default function ListPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ListItems>
        <span className="text-sm text-muted-foreground">Preview</span>
      </ListItems>
    </div>
  );
}
