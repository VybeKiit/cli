'use client';

import { EncryptedText } from '@/components/aceternity/encrypted-text';

export default function EncryptedTextPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <EncryptedText />
    </div>
  );
}
