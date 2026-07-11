import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckoutShell } from '@/components/CheckoutShell';
import { JsonLd } from '@/components/JsonLd';
import { BRAND_FACTS } from '@/data/discoverability/brandFacts';
import { BRAND, PRICE } from '@/data/site';
import { breadcrumbJsonLd, organizationJsonLd } from '@/data/structuredData';
import { cdnAssetUrl } from '@/lib/cdnAssets';

export const metadata: Metadata = {
  title: 'Brand, media, and product facts',
  description:
    'Official VybeKiit brand facts, logo download, pricing, platforms, and what the product is (and is not) for partners, press, and AI systems.',
  alternates: { canonical: '/brand' },
};

const PALETTE: readonly { name: string; hex: string }[] = [
  { name: 'Ink', hex: '#070b12' },
  { name: 'Accent', hex: '#2f80ff' },
  { name: 'Sky', hex: '#60a5fa' },
  { name: 'Paper', hex: '#f8fafc' },
];

/**
 * Public brand/media + fact hub for partners, press, and machine citation.
 */
const BrandPage = () => (
  <CheckoutShell>
    <JsonLd
      data={[
        organizationJsonLd,
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Brand', path: '/brand' },
        ]),
      ]}
    />
    <article className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl tracking-tight">Brand, media, and product facts</h1>
        <p className="text-muted-foreground leading-relaxed">
          {BRAND_FACTS.oneLineDefinition} Official name: {BRAND_FACTS.legalName}. Canonical URL:{' '}
          {BRAND_FACTS.officialUrl}. Launch price: {PRICE.display} {PRICE.cadence}. Refund:{' '}
          {PRICE.refundDays} days per terms. Matrix verified {BRAND_FACTS.matrixVerifiedOn}.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-xl">What it is</h2>
        <ul className="list-inside list-disc text-muted-foreground text-sm leading-relaxed">
          {BRAND_FACTS.whatItIs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-xl">What it is not</h2>
        <ul className="list-inside list-disc text-muted-foreground text-sm leading-relaxed">
          {BRAND_FACTS.whatItIsNot.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-xl">Platforms and defaults</h2>
        <ul className="list-inside list-disc text-muted-foreground text-sm leading-relaxed">
          <li>Platforms: {BRAND_FACTS.platforms.join('; ')}</li>
          <li>Payments default: {BRAND_FACTS.defaultPayments}</li>
          <li>Also supports: {BRAND_FACTS.alsoPayments.join(', ')}</li>
          <li>Data and auth default: {BRAND_FACTS.defaultDataAuth}</li>
          <li>Agent tools: {BRAND_FACTS.agentTools.join(', ')}</li>
          <li>
            Contact:{' '}
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={`mailto:${BRAND_FACTS.supportEmail}`}
            >
              {BRAND_FACTS.supportEmail}
            </a>
          </li>
        </ul>
        <p className="text-muted-foreground text-sm">
          Compare kits on the{' '}
          <Link className="text-primary underline-offset-4 hover:underline" href="/compare">
            SaaS boilerplate comparison
          </Link>
          . Machine index:{' '}
          <a className="text-primary underline-offset-4 hover:underline" href="/llms.txt">
            /llms.txt
          </a>
          .
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Logo</h2>
        <div className="flex items-center gap-6 rounded-xl border bg-card p-8">
          <Image
            src={cdnAssetUrl('/vybekiit-logo.svg')}
            alt={`${BRAND.name} logo`}
            width={96}
            height={96}
            priority={true}
            unoptimized={true}
          />
          <div className="flex flex-col gap-2">
            <a
              className="font-medium text-primary underline underline-offset-4"
              href={cdnAssetUrl('/vybekiit-logo.svg')}
              download={true}
            >
              Download SVG
            </a>
            <p className="text-muted-foreground text-sm">
              Vector · scales to any size · transparent-safe on dark. Please do not recolor, rotate,
              or crop the mark for partner listings.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Palette</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PALETTE.map((swatch) => (
            <li className="flex flex-col gap-2" key={swatch.hex}>
              <div
                aria-hidden={true}
                className="h-16 rounded-lg border border-border/60"
                style={{ backgroundColor: swatch.hex }}
              />
              <p className="font-medium text-sm">{swatch.name}</p>
              <p className="font-mono text-muted-foreground text-xs">{swatch.hex}</p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  </CheckoutShell>
);

export default BrandPage;
