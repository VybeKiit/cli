'use client';

import { motion, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/utils';

import { GradientHeading } from '../ui/gradient-heading';
import { HoverVideoPlayer } from '../ui/hover-video-player';

export default function HoverVideoPlayerDemo() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex flex-col gap-12 py-12 w-full h-full items-center justify-center">
      <div className="text-center">
        <GradientHeading>Hover video player</GradientHeading>
      </div>
      <div className="w-full max-w-4xl">
        <motion.div
          style={{
            clipPath: shouldReduceMotion
              ? 'inset(0 0 0 0 round 0.5rem)'
              : 'inset(12% 25% 12% 25% round 0.5rem)',
          }}
          whileHover={
            shouldReduceMotion ? undefined : { clipPath: 'inset(0% 0% 0% 0% round 0.5rem)' }
          }
          transition={{
            type: 'spring',
            duration: 0.42,
            bounce: 0,
          }}
          className={cn(
            'group relative flex flex-col overflow-hidden rounded-lg w-full h-full transform-gpu',
            'bg-white shadow-sm ring-1 ring-black/5',
            'data-dark:bg-stone-800 data-dark:ring-white/15',
          )}
        >
          <HoverVideoPlayer
            videoSrc="https://player.vimeo.com/video/1037289858"
            thumbnailSrc="/placeholders/newcopy-thumbnail.png"
            enableControls={true}
            style={{
              width: '100%',
              maxWidth: '100vw',
              aspectRatio: '16/9',
            }}
          />
        </motion.div>
      </div>

      <a href="https://www.newcult.co" target="_blank" rel="noreferrer">
        newcopy.ai
      </a>
    </div>
  );
}
