'use client';

import { CreditCard } from '@/components/kibo/credit-card/index';

export default function CreditCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <CreditCard />
    </div>
  );
}
