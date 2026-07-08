import { ImageResponse } from 'next/og';
import { BRAND, PRICE } from '@/data/site';

/** Alt text for the generated social card. */
export const alt = `${BRAND.name} — ${BRAND.tagline}`;

/** The 1.91:1 card dimensions social platforms expect. */
export const size = { width: 1200, height: 630 };

/** Baked to PNG at build time (no dynamic params), so it ships as a static asset. */
export const contentType = 'image/png';

/**
 * Statically generated Open Graph / Twitter card — dark, on-brand, and derived
 * from the same SSOT the page renders. Next auto-wires it into `og:image` and
 * `twitter:image`, so no metadata reference is needed.
 *
 * @returns The rendered social-card image.
 */
const OpengraphImage = (): ImageResponse =>
  new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px',
        background: 'linear-gradient(135deg, #0B0E14 0%, #111827 55%, #1E1B4B 100%)',
        color: '#E8EAED',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {BRAND.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <div
          style={{
            display: 'flex',
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: '920px',
          }}
        >
          {BRAND.tagline}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            color: '#B9BDC6',
            maxWidth: '880px',
            lineHeight: 1.35,
          }}
        >
          Describe it in plain language. The agent builds it, deploys it, and takes payments.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 24px',
            borderRadius: '999px',
            background: '#3DDC84',
            color: '#06210F',
            fontWeight: 700,
          }}
        >
          {PRICE.display} one-time
        </div>
        <div style={{ display: 'flex', color: '#9CA3AF' }}>Web · Mobile · Extension</div>
      </div>
    </div>,
    size,
  );

export default OpengraphImage;
