'use client';

import SocialCards from '@/components/blocks/21st/card-fan-carousel';

const CARDS = [
  {
    imgUrl:
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80',
    alt: 'Abstract 1',
  },
  {
    imgUrl:
      'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=400&auto=format&fit=crop&q=80',
    alt: 'Abstract 2',
  },
  {
    imgUrl:
      'https://images.unsplash.com/photo-1614850717567-1ced778c2a0b?w=400&auto=format&fit=crop&q=80',
    alt: 'Abstract 3',
  },
  {
    imgUrl:
      'https://images.unsplash.com/photo-1618004912476-29818dbb9162?w=400&auto=format&fit=crop&q=80',
    alt: 'Abstract 4',
  },
  {
    imgUrl:
      'https://images.unsplash.com/photo-1614854262312-831c147a63b4?w=400&auto=format&fit=crop&q=80',
    alt: 'Abstract 5',
  },
];

export default function CardFanCarouselPreview() {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-4">
      <SocialCards cards={CARDS} />
    </div>
  );
}
