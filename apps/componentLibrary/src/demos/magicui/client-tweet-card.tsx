'use client';

import { ClientTweetCard } from '@/components/magicui/client-tweet-card';

export default function ClientTweetCardPreview() {
  return (
    <div className="flex min-h-[200px] items-center justify-center overflow-hidden p-6">
      <ClientTweetCard />
    </div>
  );
}
