import Link from 'next/link';
import { BRAND, FOOTER_LINKS } from '@/data/site';

const YEAR = new Date().getFullYear();

/** Store footer with the legal links every product needs (terms + privacy). */
export const SiteFooter = () => (
  <footer className="border-t">
    <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        © {YEAR} {BRAND.name}. All rights reserved.
      </p>
      <div className="flex gap-4">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  </footer>
);
