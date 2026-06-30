import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { INCLUDED, NOT_INCLUDED_NOTE, NOT_INCLUDED_YET } from '@/data/pricing';
import { PRICE } from '@/data/site';
import Link from 'next/link';

/**
 * Pricing — the single one-time-price card: what is included and, per the honesty
 * rule, what is NOT pre-built yet (overclaiming drives refunds). The price comes
 * from the one `PRICE` constant in `site.ts`; the lists from typed `pricing.ts` data.
 */
export function Pricing() {
  return (
    <section id="pricing" className="border-t bg-muted/30">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-bold text-3xl tracking-tight">One price. Everything.</h2>
        <Card className="mt-10">
          <CardHeader>
            <CardTitle className="flex items-baseline gap-2">
              <span className="font-bold text-4xl">{PRICE.display}</span>
              <span className="text-muted-foreground text-sm">
                {PRICE.cadence} · {PRICE.refundDays}-day refund
              </span>
            </CardTitle>
            <CardDescription>
              {PRICE.earlyBirdNote}. The agent, the three-platform bundle, and a maintained update
              channel — for a non-technical founder who wants it shipped and kept current.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-8">
            <div>
              <h3 className="font-semibold text-sm">What is included</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {INCLUDED.map((point) => (
                  <li key={point.id} className="flex items-start gap-2">
                    <span aria-hidden={true} className="mt-0.5 text-foreground">
                      ✓
                    </span>
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Not in the box yet</h3>
              <ul className="mt-3 flex flex-col gap-2 text-muted-foreground text-sm">
                {NOT_INCLUDED_YET.map((point) => (
                  <li key={point.id} className="flex items-start gap-2">
                    <span aria-hidden={true} className="mt-0.5">
                      –
                    </span>
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
                {NOT_INCLUDED_NOTE}
              </p>
            </div>
            <Button asChild={true} size="lg" className="w-full">
              <Link href="/checkout">Get VybeKiit — {PRICE.display}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
