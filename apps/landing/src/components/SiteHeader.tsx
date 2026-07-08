import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BRAND, HEADER_LINKS } from '@/data/site';

/** Top navigation for the store. Logical spacing mirrors under RTL. */
export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
    <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
      <Link href="/" className="font-semibold text-lg">
        {BRAND.name}
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {HEADER_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hidden text-muted-foreground hover:text-foreground sm:inline"
          >
            {link.label}
          </Link>
        ))}
        <Button asChild={true} size="sm">
          <Link href="/checkout">Get it</Link>
        </Button>
      </div>
    </nav>
  </header>
);
