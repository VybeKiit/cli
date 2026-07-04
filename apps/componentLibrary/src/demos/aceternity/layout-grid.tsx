'use client';

import { LayoutGrid } from '@/components/aceternity/ui/layout-grid';

const SAMPLE_CARDS = [
  {
    id: 1,
    className: 'col-span-1 md:col-span-2',
    thumbnail: 'https://images.unsplash.com/photo-1476231682828-826e0fc57118?w=800&q=80',
    content: (
      <div className="p-4">
        <p className="font-bold text-neutral-800 text-xl md:text-2xl dark:text-neutral-100">
          Studio workspace
        </p>
        <p className="mt-2 text-neutral-600 text-sm dark:text-neutral-300">
          A flexible layout for creative teams.
        </p>
      </div>
    ),
  },
  {
    id: 2,
    className: 'col-span-1',
    thumbnail: 'https://images.unsplash.com/photo-1464822759844-d150baec049e?w=800&q=80',
    content: (
      <div className="p-4">
        <p className="font-bold text-neutral-800 text-xl md:text-2xl dark:text-neutral-100">
          Mountain retreat
        </p>
      </div>
    ),
  },
  {
    id: 3,
    className: 'col-span-1',
    thumbnail: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80',
    content: (
      <div className="p-4">
        <p className="font-bold text-neutral-800 text-xl md:text-2xl dark:text-neutral-100">
          Night sky
        </p>
      </div>
    ),
  },
];

export default function LayoutGridPreview() {
  return (
    <div className="overflow-hidden p-4">
      <LayoutGrid cards={SAMPLE_CARDS} />
    </div>
  );
}
