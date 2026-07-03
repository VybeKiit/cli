import Image from 'next/image';
import { CheckoutShell } from '@/components/checkout-shell';
import { BRAND } from '@/data/site';

export const metadata = {
  title: 'Brand & Media — VybeKiit',
  description:
    'Logo, colors, and usage for VybeKiit. Download the mark for partner listings and press.',
};

const PALETTE: readonly { name: string; hex: string }[] = [
  { name: 'Ink', hex: '#070b12' },
  { name: 'Accent', hex: '#2f80ff' },
  { name: 'Sky', hex: '#60a5fa' },
  { name: 'Paper', hex: '#f8fafc' },
];

/**
 * Public brand/media page — the URL partner listings (Supabase, Stripe, etc.) point at
 * for logo download and usage. Serves the real mark from /public and states the rules.
 */
export default function BrandPage() {
  return (
    <CheckoutShell>
      <article className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="font-bold text-3xl tracking-tight">Brand & Media</h1>
          <p className="text-muted-foreground">
            {BRAND.name} — {BRAND.tagline} Download the mark below for partner listings,
            directories, and press. Please don't recolor, rotate, or crop it.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-xl">Logo</h2>
          <div className="flex items-center gap-6 rounded-xl border bg-card p-8">
            <Image
              src="/vybekiit-logo.svg"
              alt="VybeKiit logo"
              width={96}
              height={96}
              priority={true}
            />
            <div className="flex flex-col gap-2">
              <a
                className="font-medium text-primary underline underline-offset-4"
                href="/vybekiit-logo.svg"
                download={true}
              >
                Download SVG
              </a>
              <p className="text-muted-foreground text-sm">
                Vector · scales to any size · transparent-safe on dark.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="font-semibold text-xl">Colors</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {PALETTE.map((color) => (
              <div key={color.hex} className="flex flex-col gap-2">
                <div className="h-16 rounded-lg border" style={{ backgroundColor: color.hex }} />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{color.name}</span>
                  <span className="text-muted-foreground text-xs uppercase">{color.hex}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-xl">Usage</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-muted-foreground">
            <li>Use the mark as provided — no recoloring, stretching, or added effects.</li>
            <li>Keep clear space around the logo equal to at least half its height.</li>
            <li>
              For questions, email{' '}
              <a
                className="text-primary underline underline-offset-4"
                href="mailto:support@vybekiit.com"
              >
                support@vybekiit.com
              </a>
              .
            </li>
          </ul>
        </section>
      </article>
    </CheckoutShell>
  );
}
