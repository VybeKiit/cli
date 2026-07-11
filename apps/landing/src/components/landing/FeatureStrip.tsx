import { FeatureIcon } from '@/components/ui/CustomIcons';
import { FEATURE_STRIP } from '@/data/landing';

/**
 * Five-icon feature strip beneath the hero.
 *
 * @returns The rendered FeatureStrip element.
 * @example
 * ```tsx
 * <FeatureStrip />
 * ```
 */

export const FeatureStrip = () => (
  <div className="relative mx-auto mb-[84px] w-full max-w-none px-[96px]">
    <div className="feature-strip">
      {FEATURE_STRIP.map((item) => (
        <div className="group flex items-center gap-[30px]" key={item.id}>
          <FeatureIcon
            className="h-[66px] w-[66px] min-w-[66px] shrink-0 text-[rgba(255,255,255,0.88)] drop-shadow-[0_0_10px_rgba(255,255,255,0.16)] transition-colors group-hover:text-[var(--blue-soft)]"
            type={item.icon}
          />
          <div className="min-w-0">
            <p className="whitespace-nowrap text-4xl font-extrabold leading-[1.05] tracking-[-0.045em] text-[rgba(255,255,255,0.94)]">
              {item.title}
            </p>
            <p className="mt-2.5 whitespace-nowrap text-3xl leading-[1.15] tracking-[-0.035em] text-[rgba(255,255,255,0.72)]">
              {item.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
