'use client';

import { TRUST_GRID_LOGOS } from '@/components/marketing/logoMarkCatalog';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

function TrustLogoCard({
  label,
  brandHex,
  src,
  invertOnDark,
}: (typeof TRUST_GRID_LOGOS)[number]) {
  return (
    <motion.div
      className={cn(
        'group relative flex aspect-[2/1] cursor-default flex-col items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 p-4',
        'opacity-55 grayscale transition-[opacity,filter] duration-300',
      )}
      initial={false}
      whileHover={{
        opacity: 1,
        filter: 'grayscale(0)',
        boxShadow: `0 0 0 1px ${brandHex}33, 0 8px 32px -8px ${brandHex}66`,
      }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at center, ${brandHex}22 0%, transparent 70%)`,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      />
      <img
        alt={label}
        className={cn(
          'relative z-10 h-8 w-auto max-w-[80%] object-contain',
          invertOnDark && 'dark:invert',
        )}
        decoding="async"
        loading="lazy"
        src={src}
      />
      <span className="relative z-10 text-[11px] font-medium text-muted-foreground">{label}</span>
    </motion.div>
  );
}

export default function LogoTrustGrid() {
  return (
    <div className="bg-background flex size-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border p-8 md:p-12">
      <p className="text-center text-muted-foreground text-sm">Trusted by teams building with</p>
      <div className="grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-4">
        {TRUST_GRID_LOGOS.map((logo) => (
          <TrustLogoCard key={logo.slug} {...logo} />
        ))}
      </div>
    </div>
  );
}
