'use client';

import { QRCode } from '@/components/kibo/qr-code/index';

export default function QrCodePreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <QRCode />
    </div>
  );
}
