import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Caveat } from 'next/font/google';

/**
 * Primary display and body font — Geist Sans with CSS variable.
 */

export const geistSans = GeistSans;

/**
 * Monospace for logs, timestamps, and technical UI.
 */

export const geistMono = GeistMono;

/**
 * Casual handwriting for meta “built with” notes vibe coders notice.
 */
export const handwriting = Caveat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-handwriting',
  display: 'swap',
});

/**
 * Combined font class names for the landing page wrapper.
 */

export const landingFontClasses = `${geistSans.variable} ${geistMono.variable} ${handwriting.variable}`;
