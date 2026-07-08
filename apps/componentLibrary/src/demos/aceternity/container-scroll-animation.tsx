'use client';

import {
  Card,
  ContainerScroll,
  Header,
} from '@/components/aceternity/ui/container-scroll-animation';

export default function ContainerScrollAnimationPreview() {
  return (
    <div className="flex min-h-[200px] flex-wrap items-center justify-center gap-3 overflow-hidden p-6">
      <ContainerScroll />
      <Header />
      <Card />
    </div>
  );
}
