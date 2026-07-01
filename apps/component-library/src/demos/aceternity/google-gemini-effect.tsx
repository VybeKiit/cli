'use client';

import { GoogleGeminiEffect } from '@/components/aceternity/google-gemini-effect';
import { useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export default function GoogleGeminiEffectDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const pathLengths = [
    useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.15, 1.1]),
    useTransform(scrollYProgress, [0, 0.8], [0.1, 1.0]),
    useTransform(scrollYProgress, [0, 0.8], [0.05, 0.9]),
    useTransform(scrollYProgress, [0, 0.8], [0, 0.8]),
  ];

  return (
    <div ref={ref} className="h-[200vh] w-full bg-black">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <GoogleGeminiEffect pathLengths={pathLengths} />
      </div>
    </div>
  );
}
