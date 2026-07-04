'use client';

import { Pagination } from '@/components/untitled/pagination/pagination-base';

export default function PaginationBasePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Pagination>
        <span className="text-sm text-muted-foreground">Preview</span>
      </Pagination>
    </div>
  );
}
