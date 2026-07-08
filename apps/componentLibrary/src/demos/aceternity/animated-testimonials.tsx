'use client';

import { AnimatedTestimonials } from '@/components/aceternity/ui/animated-testimonials';

const TESTIMONIALS = [
  {
    quote:
      'VybeKiit helped us ship a polished product in days instead of months. The component library is incredible.',
    name: 'Sarah Chen',
    designation: 'Founder at LaunchPad',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  },
  {
    quote:
      'The AI operator bundle is exactly what we needed — web, mobile, and extension all wired together.',
    name: 'Marcus Webb',
    designation: 'CTO at Stackline',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  },
  {
    quote: 'Best starter kit we have used. Copy a block, paste it in, and it just works.',
    name: 'Elena Rossi',
    designation: 'Product Lead at Nova',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
  },
];

export default function AnimatedTestimonialsPreview() {
  return (
    <div className="overflow-hidden p-4">
      <AnimatedTestimonials autoplay={true} testimonials={TESTIMONIALS} />
    </div>
  );
}
