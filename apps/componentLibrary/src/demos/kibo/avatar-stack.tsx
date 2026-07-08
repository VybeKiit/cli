'use client';

import { AvatarStack } from '@/components/kibo/avatar-stack/index';

export default function AvatarStackPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <AvatarStack>
        <span className="text-sm text-muted-foreground">Preview</span>
      </AvatarStack>
    </div>
  );
}
