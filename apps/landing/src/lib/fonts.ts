import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Inter } from 'next/font/google';

/**
 * Primary display and body font — Geist Sans with CSS variable.
 */

export const geistSans = GeistSans;

/**
 * Monospace for logs, timestamps, and technical UI.
 */

export const geistMono = GeistMono;

/**
 * Fallback sans when Geist is unavailable.
 */

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Combined font class names for the landing page wrapper.
 */

export const landingFontClasses = `${geistSans.variable} ${geistMono.variable} ${inter.variable}`;
