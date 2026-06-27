import { Button } from '@/components/ui/button';
import { HEADER_LINKS } from '@/data/nav';
import Link from 'next/link';

/** Top navigation for marketing pages. Logical spacing mirrors under RTL. */
export function SiteHeader() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-semibold text-lg">
          My App
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {HEADER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
