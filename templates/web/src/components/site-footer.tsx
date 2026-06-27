import Link from 'next/link';

const YEAR = new Date().getFullYear();

/** Marketing footer with the legal links every product needs (terms + privacy). */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-6 py-8 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>© {YEAR} My App. All rights reserved.</p>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
