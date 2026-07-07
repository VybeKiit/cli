import type { ReactNode } from 'react';

interface RootLayoutProps {
  readonly children?: ReactNode;
}

/**
 * Render the root layout handoff to the locale-specific layout.
 *
 * @param props - Optional route content.
 * @returns The child route tree.
 * @example
 * <RootLayout><LocaleLayout /></RootLayout>
 */
const RootLayout = ({ children = null }: RootLayoutProps) => children;

export default RootLayout;
