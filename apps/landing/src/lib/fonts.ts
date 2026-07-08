import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

/**
 * Primary display and body font — Geist Sans with CSS variable.
 */

export const geistSans = GeistSans;

/**
 * Monospace for logs, timestamps, and technical UI.
 */

export const geistMono = GeistMono;

/**
 * Combined font class names for the landing page wrapper.
 */

export const landingFontClasses = `${geistSans.variable} ${geistMono.variable}`;
