'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { OperatorStepIllustration } from '@/components/sections/OperatorStepIllustrations';
import { Card, CardContent } from '@/components/ui/card';
import { LANDING_EASE } from '@/data/landing';
import { OPERATOR_STEPS_SECTION } from '@/data/visitorLanding';
import { cn } from '@/lib/utils';

/** Soft overshoot for icon pop — professional, not bouncy. */
const POP_EASE = [0.22, 1.2, 0.36, 1] as const;

const sectionReveal = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.04,
    },
  },
} as const;

const headingReveal = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)', scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.85, ease: LANDING_EASE },
  },
} as const;

const gridReveal = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.11,
      delayChildren: 0.08,
    },
  },
} as const;

const cardReveal = {
  hidden: { opacity: 0, y: 40, scale: 0.92, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.7,
      ease: LANDING_EASE,
      when: 'beforeChildren' as const,
      staggerChildren: 0.09,
    },
  },
} as const;

const iconReveal = {
  hidden: { opacity: 0, scale: 0.55, rotate: -12, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    y: 0,
    transition: { duration: 0.6, ease: POP_EASE },
  },
} as const;

const copyReveal = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: LANDING_EASE },
  },
} as const;

/**
 * Five Plan→Live operator step cards with custom SVG illustrations.
 * Heading and cards cascade in on scroll for a polished flow.
 *
 * @returns The rendered operator steps section.
 * @example
 * <OperatorSteps />
 */
export const OperatorSteps = () => {
  const reduced = useReducedMotion();
  const animate = reduced ? false : ('hidden' as const);

  return (
    <motion.section
      className="mx-auto max-w-5xl px-6 py-16"
      id="features"
      initial={animate}
      variants={sectionReveal}
      viewport={{ once: true, amount: 0.22, margin: '0px 0px -8% 0px' }}
      whileInView="visible"
    >
      <motion.h2
        className="text-center font-bold text-3xl tracking-tight will-change-transform"
        variants={headingReveal}
      >
        {OPERATOR_STEPS_SECTION.heading}
      </motion.h2>

      <motion.div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" variants={gridReveal}>
        {OPERATOR_STEPS_SECTION.steps.map((step) => {
          const featured = step.featured;
          return (
            <motion.div className="will-change-transform" key={step.id} variants={cardReveal}>
              <Card
                className={cn(
                  'h-full border shadow-none transition-shadow hover:shadow-sm',
                  featured
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-border bg-card text-card-foreground',
                )}
              >
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <motion.div
                    className={cn(
                      'flex size-12 items-center justify-center rounded-xl will-change-transform',
                      featured ? 'bg-white/12 text-white' : 'bg-muted text-foreground',
                    )}
                    variants={iconReveal}
                  >
                    <OperatorStepIllustration
                      className="size-10"
                      featured={featured}
                      icon={step.icon}
                    />
                  </motion.div>
                  <motion.div className="flex items-center gap-1.5" variants={copyReveal}>
                    <h3 className="font-semibold text-base">{step.title}</h3>
                    {featured ? <Check aria-hidden={true} className="size-4 shrink-0" /> : null}
                  </motion.div>
                  <motion.p
                    className={cn(
                      'text-sm leading-relaxed',
                      featured ? 'text-white/90' : 'text-muted-foreground',
                    )}
                    variants={copyReveal}
                  >
                    {step.body}
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.section>
  );
};
