'use client';

import { ArrowRight, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/blocks/21st/be-ui-button';

export default function BeUiButtonPreview() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="md">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="md">
          <Download className="h-4 w-4" />
          Download
        </Button>
        <Button variant="outline" size="md">
          Outline
        </Button>
        <Button variant="ghost" size="md">
          Ghost
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" size="md" ripple={true}>
          Ripple
        </Button>
        <Button variant="outline" size="md" ripple={true}>
          Tap me
        </Button>
      </div>
      <Button variant="secondary" size="icon" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
