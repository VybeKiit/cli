'use client';

import { FeatureIcon } from '@/components/ui/CustomIcons';
import { TypewriterSequence } from '@/components/ui/TypewriterSequence';
import { FEATURE_STRIP } from '@/data/landing';

/** Five-icon feature strip beneath the hero. */
export function FeatureStrip() {
  return (
    <div className="relative mx-auto w-[calc(100%-48px)] max-w-[1520px]">
      <div className="feature-strip grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 lg:gap-16">
        {FEATURE_STRIP.map((item) => (
          <div
            className="group flex flex-col items-center text-center lg:items-start lg:text-start"
            key={item.id}
          >
            <FeatureIcon
              className="mb-4 h-[38px] w-[38px] text-white transition-colors group-hover:text-[var(--blue-soft)]"
              type={item.icon}
            />
            <TypewriterSequence
              lines={[
                {
                  text: item.title,
                  as: 'p',
                  className:
                    'text-base font-extrabold text-white transition-[text-shadow] group-hover:[text-shadow:0_0_24px_rgba(47,128,255,0.35)]',
                },
                {
                  text: item.subtitle,
                  as: 'p',
                  className: 'mt-1 text-[13px] text-[var(--text-muted)]',
                },
              ]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
