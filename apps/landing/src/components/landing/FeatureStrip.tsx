import { FeatureIcon } from '@/components/ui/CustomIcons';
import { FEATURE_STRIP } from '@/data/landing';

/** Five-icon feature strip beneath the hero. */
export function FeatureStrip() {
  return (
    <div className="relative mx-auto w-[calc(100%-48px)] max-w-[1520px]">
      <div className="feature-strip grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {FEATURE_STRIP.map((item) => (
          <div className="group flex items-center gap-3" key={item.id}>
            <FeatureIcon
              className="h-8 w-8 shrink-0 text-white transition-colors group-hover:text-[var(--blue-soft)]"
              type={item.icon}
            />
            <div className="min-w-0">
              <p className="font-bold text-[15px] text-white">{item.title}</p>
              <p className="text-[13px] text-[var(--text-muted)]">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
