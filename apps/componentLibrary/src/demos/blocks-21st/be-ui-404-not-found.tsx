'use client';

import { NotFoundGlitch } from '@/components/blocks/21st/be-ui-404-not-found';

export default function BeUi404Preview() {
  return (
    <div className="flex min-h-[420px] items-center justify-center p-6">
      <NotFoundGlitch homeHref="#" browseHref="#" />
    </div>
  );
}
