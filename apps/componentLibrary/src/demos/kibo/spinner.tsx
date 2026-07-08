'use client';

import { Spinner } from '@/components/kibo/spinner/index';

export default function SpinnerPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Spinner />
    </div>
  );
}
