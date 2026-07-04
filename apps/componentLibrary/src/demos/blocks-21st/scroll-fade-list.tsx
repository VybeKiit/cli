'use client';

import { ScrollFadeList } from '@/components/blocks/21st/scroll-fade-list';

const ITEMS = [
  { id: '1', label: 'Design system tokens' },
  { id: '2', label: 'Component library sync' },
  { id: '3', label: 'Preview device frames' },
  { id: '4', label: 'Logo trust grid' },
  { id: '5', label: '21st.dev blocks' },
  { id: '6', label: 'E2E smoke tests' },
  { id: '7', label: 'Brand mark pipeline' },
  { id: '8', label: 'Gallery taxonomy' },
];

export default function ScrollFadeListPreview() {
  return (
    <div className="flex min-h-[360px] items-center justify-center p-6">
      <ScrollFadeList
        className="relative w-full max-w-md overflow-hidden rounded-xl border bg-background [--scroll-fade-list-bg:hsl(var(--background))]"
        getKey={(item) => item.id}
        items={ITEMS}
        renderItem={(item) => (
          <div className="border-b px-4 py-3 text-sm last:border-b-0">{item.label}</div>
        )}
      />
    </div>
  );
}
