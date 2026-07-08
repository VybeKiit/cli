'use client';

import ContributorsWall from '@/components/blocks/21st/contributors-section';

const SAMPLE = [
  { username: 'alex', avatarUrl: 'https://avatar.vercel.sh/alex' },
  { username: 'jordan', avatarUrl: 'https://avatar.vercel.sh/jordan' },
  { username: 'sam', avatarUrl: 'https://avatar.vercel.sh/sam' },
  { username: 'riley', avatarUrl: 'https://avatar.vercel.sh/riley' },
  { username: 'casey', avatarUrl: 'https://avatar.vercel.sh/casey' },
  { username: 'morgan', avatarUrl: 'https://avatar.vercel.sh/morgan' },
  { username: 'taylor', avatarUrl: 'https://avatar.vercel.sh/taylor' },
  { username: 'quinn', avatarUrl: 'https://avatar.vercel.sh/quinn' },
];

export default function ContributorsSectionPreview() {
  return (
    <div className="min-h-[360px] p-4">
      <ContributorsWall contributors={SAMPLE} columns={8} height={280} />
    </div>
  );
}
