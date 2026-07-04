'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { SectionShell } from '@/components/ui/SectionShell';
import { FAQ } from '@/data/faq';
import { LANDING_EASE, LANDING_FAQ_IDS } from '@/data/landing';

const LANDING_FAQ = FAQ.filter((item) => (LANDING_FAQ_IDS as readonly string[]).includes(item.id));

/** Minimal FAQ accordion with cinematic styling. */
export function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(LANDING_FAQ[0]?.id ?? null);

  return (
    <SectionShell className="py-16 md:py-24" id="faq">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.75, ease: LANDING_EASE }}
        viewport={{ once: true, amount: 0.2 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <p className="landing-label">FAQ</p>
        <h2 className="mt-3 font-[800] text-3xl text-white tracking-[-0.04em] md:text-5xl">
          Questions buyers ask
        </h2>
        <div className="mt-10 divide-y divide-white/10 rounded-2xl border border-white/10">
          {LANDING_FAQ.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id}>
                <button
                  aria-expanded={open}
                  className="flex w-full items-start justify-between gap-4 px-6 py-5 text-start transition-colors hover:bg-white/[0.02]"
                  onClick={() => setOpenId(open ? null : item.id)}
                  type="button"
                >
                  <h3 className="font-semibold text-base text-white md:text-lg">{item.question}</h3>
                  <span className="text-[var(--text-muted)]">{open ? '−' : '+'}</span>
                </button>
                {open ? (
                  <p className="px-6 pb-5 text-[var(--text-muted)] leading-relaxed">
                    {item.answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </motion.div>
    </SectionShell>
  );
}
