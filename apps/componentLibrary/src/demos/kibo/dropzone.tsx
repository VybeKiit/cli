'use client';

import { Dropzone } from '@/components/kibo/dropzone/index';

export default function DropzonePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <Dropzone />
    </div>
  );
}
