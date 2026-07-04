'use client';

import { Button } from '@/components/aceternity/stateful-button';

export default function StatefulButtonPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Button>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Button>
    </div>
  );
}
