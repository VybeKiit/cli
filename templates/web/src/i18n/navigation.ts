import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Locale-aware Link, redirect, and router — use instead of next/link in UI code. */
export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation(routing);
