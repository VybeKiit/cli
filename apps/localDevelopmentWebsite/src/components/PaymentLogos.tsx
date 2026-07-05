'use client';

import { cn } from '@/lib/utils';

type LogoItem = {
  name: string;
  color: string;
  svg: string;
};

/** Precise brand SVG logos for payment providers */
const PAYMENT_LOGOS: LogoItem[] = [
  {
    name: 'Stripe',
    color: '#635BFF',
    svg: `<svg viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M13.3 11.3c0-.77.63-1.07 1.68-1.07 1.5 0 3.39.46 4.89 1.27V7.6c-1.64-.65-3.26-.91-4.89-.91-4 0-6.66 2.09-6.66 5.58 0 5.44 7.5 4.57 7.5 6.92 0 .92-.8 1.21-1.91 1.21-1.65 0-3.76-.68-5.43-1.59v3.96c1.85.8 3.71 1.13 5.43 1.13 4.1 0 6.91-2.03 6.91-5.57-.01-5.87-7.52-4.83-7.52-6.93z" fill="white"/></svg>`,
  },
  {
    name: 'PayPal',
    color: '#003087',
    svg: `<svg viewBox="0 0 24 24" fill="none"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.65a.768.768 0 0 1 .757-.65h6.15c2.04 0 3.653.57 4.734 1.616.977.948 1.483 2.318 1.396 3.96-.21 3.995-2.79 6.19-6.76 6.19H9.06a.768.768 0 0 0-.757.65l-1.227 7.521z" fill="currentColor"/><path d="M19.188 7.232c-.485 3.49-2.94 5.508-6.452 5.508h-1.6a.545.545 0 0 0-.538.462l-.87 5.507-.265 1.682a.36.36 0 0 0 .357.416h2.82a.545.545 0 0 0 .538-.462l.698-4.426a.545.545 0 0 1 .538-.462h1.278c2.885 0 5.146-1.748 5.72-4.55.274-1.339.088-2.448-.674-3.24-.453-.47-1.068-.794-1.81-.99" fill="currentColor" opacity=".7"/></svg>`,
  },
  {
    name: 'Lemon Squeezy',
    color: '#FFC233',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7.4916 10.835 2.3748-6.5114a3.1497 3.1497 0 0 0-.065-2.3418C9.0315.183 6.9427-.398 5.2928.265 3.643.929 2.71 2.4348 3.512 4.3046l2.8197 6.5615c.219.509.97.489 1.16-.03m1.6798 1.0969 6.5334-2.7758c2.1699-.9219 2.7218-3.6907 1.022-5.2905l-.068-.063c-1.6669-1.5469-4.4217-1.002-5.3706 1.0359L8.3566 11.135c-.234.503.295 1.0199.8159.7979m.373.87 6.6454-2.5119c2.2078-.8349 4.6206.745 4.5886 3.0398l-.002.09c-.048 2.2358-2.3938 3.7376-4.5536 2.9467l-6.6724-2.4418a.595.595 0 0 1-.006-1.1229m-.386 1.9269 6.4375 2.9767a3.2997 3.2997 0 0 1 1.6658 1.6989c.769 1.7998-.283 3.6396-1.9328 4.3016-1.6499.662-3.4097.235-4.2097-1.6359l-2.8027-6.5694c-.217-.509.328-1.009.8419-.772"/></svg>`,
  },
];

type PaymentLogosProps = {
  active: boolean;
};

export const PaymentLogos = ({ active }: PaymentLogosProps) => (
  <div className="flex flex-wrap gap-2 mt-2">
    {PAYMENT_LOGOS.map((provider) => (
      <div
        key={provider.name}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-all duration-500',
          active
            ? 'border-transparent opacity-100 shadow-[0_0_12px_var(--glow)]'
            : 'border-zinc-800 opacity-30 grayscale',
        )}
        style={{ '--glow': `${provider.color}66` } as React.CSSProperties}
      >
        <div
          className={cn('h-5 w-5 transition-all duration-500', active ? '' : 'opacity-40')}
          style={{ color: active ? provider.color : '#71717a' }}
          dangerouslySetInnerHTML={{ __html: provider.svg }}
        />
        <span
          className={cn(
            'text-xs font-medium transition-colors duration-500',
            active ? 'text-zinc-200' : 'text-zinc-600',
          )}
        >
          {provider.name}
        </span>
      </div>
    ))}
  </div>
);
