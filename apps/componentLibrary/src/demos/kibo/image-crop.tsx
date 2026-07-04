'use client';

import { ImageCrop } from '@/components/kibo/image-crop/index';

export default function ImageCropPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ImageCrop>
        <span className="text-sm text-muted-foreground">Preview</span>
      </ImageCrop>
    </div>
  );
}
