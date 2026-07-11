'use client';

import { Alert, AlertDescription, AlertTitle } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { RadioGroup, RadioGroupItem } from '@vybekiit/ui/radio-group';
import { Separator } from '@vybekiit/ui/separator';
import {
  CheckCircle2,
  CircleAlert,
  CreditCard,
  Loader2,
  Lock,
  Mail,
  Minus,
  PartyPopper,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdCents } from '../shared/formatUsdCents';
import { Row } from './Row';

/** Whether a line item is a downloadable good, a shipped good, or a booked service. */
type ItemKind = 'digital' | 'physical' | 'service';

/** One purchasable line in the cart. Prices are in integer cents to avoid float drift. */
type LineItem = {
  readonly id: string;
  readonly name: string;
  readonly variant: string;
  readonly kind: ItemKind;
  readonly unitPrice: number;
  readonly quantity: number;
};

const KIND_LABEL: Record<ItemKind, string> = {
  digital: 'Digital',
  physical: 'Physical',
  service: 'Service',
};

/** Realistic starting cart — a mix of digital, physical, and service goods with real quantities. */
const INITIAL_ITEMS: readonly LineItem[] = [
  {
    id: 'starter-kit',
    name: 'VybeKiit Starter Kit',
    variant: 'Lifetime license',
    kind: 'digital',
    unitPrice: 19_900,
    quantity: 1,
  },
  {
    id: 'founder-hoodie',
    name: 'Founder Hoodie',
    variant: 'Size M · Charcoal',
    kind: 'physical',
    unitPrice: 6500,
    quantity: 2,
  },
  {
    id: 'onboarding-call',
    name: 'Priority Onboarding Call',
    variant: '60 min · with an engineer',
    kind: 'service',
    unitPrice: 14_900,
    quantity: 1,
  },
];

/** Coupons this demo recognizes. A real app validates these against the payment provider instead. */
const COUPONS: Record<
  string,
  { readonly kind: 'percent' | 'flat'; readonly value: number; readonly label: string }
> = {
  VYBE20: { kind: 'percent', value: 20, label: '20% off' },
  LAUNCH50: { kind: 'flat', value: 5000, label: '$50 off' },
};

const SHIPPING: Record<'standard' | 'express', { readonly price: number; readonly eta: string }> = {
  standard: { price: 500, eta: '4–6 business days' },
  express: { price: 1500, eta: '1–2 business days' },
};
type ShippingSpeed = keyof typeof SHIPPING;

const TAX_RATE = 0.085;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

/** Applied-coupon state. `status` drives the input affordance (idle → checking → applied/invalid). */
type CouponState = {
  readonly status: 'idle' | 'checking' | 'applied' | 'invalid';
  readonly code: string;
  readonly kind?: 'percent' | 'flat';
  readonly value?: number;
  readonly label?: string;
};

type PayStatus = 'editing' | 'processing' | 'succeeded';

/**
 * A production-shaped checkout page: realistic multi-item cart, live quantity/coupon/shipping math,
 * accessible empty/loading/error/success states, and payment via a hosted-checkout handoff (the VybeKiit
 * money pipeline never touches card data). Fully interactive with local state — no backend needed to demo
 * it; see the "Plug this into your app" panel at the bottom for the real wiring.
 *
 * @returns The checkout recipe element.
 * @example
 * const element = <CheckoutPage />;
 */
export const CheckoutPage = () => {
  const emailFieldId = useId();
  const emailErrorId = useId();
  const couponFieldId = useId();
  const shippingLabelId = useId();
  const successHeadingId = useId();
  const successHeadingRef = useRef<HTMLHeadingElement>(null);

  const [items, setItems] = useState<readonly LineItem[]>(INITIAL_ITEMS);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [shipping, setShipping] = useState<ShippingSpeed>('standard');
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponState>({ status: 'idle', code: '' });
  const [payStatus, setPayStatus] = useState<PayStatus>('editing');
  const [payError, setPayError] = useState<string | null>(null);

  // Move focus to the confirmation heading when the order completes (screen-reader + keyboard users).
  useEffect(() => {
    if (payStatus === 'succeeded') {
      successHeadingRef.current?.focus();
    }
  }, [payStatus]);

  const hasPhysical = useMemo(() => items.some((item) => item.kind === 'physical'), [items]);
  const emailValid = EMAIL_PATTERN.test(email);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let discount = 0;
    if (coupon.status === 'applied' && coupon.value !== undefined) {
      discount =
        coupon.kind === 'percent'
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal);
    }
    const shippingCost = hasPhysical ? SHIPPING[shipping].price : 0;
    const tax = Math.round(Math.max(0, subtotal - discount) * TAX_RATE);
    return {
      subtotal,
      discount,
      shippingCost,
      tax,
      total: subtotal - discount + shippingCost + tax,
    };
  }, [items, coupon, shipping, hasPhysical]);

  const setQuantity = (id: string, delta: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(99, Math.max(1, item.quantity + delta)) }
          : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setCoupon((current) => (current.status === 'applied' ? { status: 'idle', code: '' } : current));
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (code.length === 0) {
      return;
    }
    setCoupon({ status: 'checking', code });
    // Simulated async validation. Real apps validate the code server-side against the provider.
    globalThis.setTimeout(() => {
      const match = COUPONS[code];
      setCoupon(
        match === undefined
          ? { status: 'invalid', code }
          : { status: 'applied', code, kind: match.kind, value: match.value, label: match.label },
      );
    }, 650);
  };

  const clearCoupon = () => {
    setCoupon({ status: 'idle', code: '' });
    setCouponInput('');
  };

  const handlePay = (event: FormEvent) => {
    event.preventDefault();
    setEmailTouched(true);
    if (!emailValid) {
      setPayError('Enter a valid email so we can send your receipt.');
      return;
    }
    setPayError(null);
    setPayStatus('processing');
    // Simulated handoff. Real apps POST /api/checkout and redirect to the hosted checkout URL.
    globalThis.setTimeout(() => setPayStatus('succeeded'), 1400);
  };

  const resetOrder = () => {
    setItems(INITIAL_ITEMS);
    setEmail('');
    setEmailTouched(false);
    setShipping('standard');
    clearCoupon();
    setPayError(null);
    setPayStatus('editing');
  };

  // ---------- success ----------
  if (payStatus === 'succeeded') {
    return (
      <DemoRecipeFrame defaultTransition="slide" title="Checkout motion pass">
        <section aria-labelledby={successHeadingId} className="mx-auto max-w-2xl px-4 py-16">
          <div className="text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <PartyPopper aria-hidden="true" className="h-8 w-8" />
            </span>
            <h1
              className="mt-6 font-bold text-3xl tracking-tight outline-none md:text-4xl"
              id={successHeadingId}
              ref={successHeadingRef}
              tabIndex={-1}
            >
              Order confirmed
            </h1>
            <p className="mt-2 text-muted-foreground">
              A receipt is on its way to{' '}
              <span className="font-medium text-foreground">{email}</span> — order{' '}
              <span className="font-mono text-foreground">#VK-4821</span>.
            </p>
          </div>
          <Card className="mt-8 text-left">
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                'We emailed your receipt and license key.',
                'Your GitHub account was invited to the private starter repos.',
                'Your onboarding call link is in the receipt.',
              ].map((line) => (
                <p className="flex items-start gap-2 text-sm" key={line}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                  />
                  <span>{line}</span>
                </p>
              ))}
              <Separator />
              <div className="flex items-center justify-between font-semibold text-sm">
                <span>Paid</span>
                <span>{formatUsdCents(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 text-center">
            <Button onClick={resetOrder} type="button" variant="outline">
              Place another order
            </Button>
          </div>
        </section>
      </DemoRecipeFrame>
    );
  }

  // ---------- empty ----------
  if (items.length === 0) {
    return (
      <DemoRecipeFrame defaultTransition="slide" title="Checkout motion pass">
        <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag aria-hidden="true" className="h-8 w-8" />
          </span>
          <h1 className="mt-6 font-bold text-2xl tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Add a product to see the live totals, shipping, and checkout flow.
          </p>
          <Button className="mt-6" onClick={resetOrder} type="button">
            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            Browse products
          </Button>
        </section>
      </DemoRecipeFrame>
    );
  }

  // ---------- editing (main) ----------
  const isProcessing = payStatus === 'processing';
  return (
    <DemoRecipeFrame defaultTransition="slide" title="Checkout motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 space-y-2">
          <Badge className="w-fit" variant="secondary">
            Checkout
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Review and pay</h1>
          <p className="max-w-xl text-muted-foreground">
            Everything below is live — adjust quantities or add a coupon and the totals recalculate.
            Try{' '}
            <button
              className="font-medium text-foreground underline decoration-dotted underline-offset-2"
              onClick={() => {
                setCouponInput('VYBE20');
                setCoupon({ status: 'idle', code: '' });
              }}
              type="button"
            >
              VYBE20
            </button>{' '}
            or remove every item to see the empty state.
          </p>
        </div>

        <form
          className="grid items-start gap-6 lg:grid-cols-[1fr_380px]"
          noValidate={true}
          onSubmit={handlePay}
        >
          {/* left: contact + shipping + payment */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail aria-hidden="true" className="h-4 w-4" /> Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor={emailFieldId}>Email for the receipt</Label>
                <Input
                  aria-describedby={emailTouched && !emailValid ? emailErrorId : undefined}
                  aria-invalid={emailTouched && !emailValid}
                  autoComplete="email"
                  id={emailFieldId}
                  onBlur={() => setEmailTouched(true)}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
                {emailTouched && !emailValid ? (
                  <p className="text-destructive text-sm" id={emailErrorId}>
                    Enter a valid email address.
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {hasPhysical ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base" id={shippingLabelId}>
                    <Truck aria-hidden="true" className="h-4 w-4" /> Shipping
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    aria-labelledby={shippingLabelId}
                    className="gap-2"
                    onValueChange={(value) => setShipping(value as ShippingSpeed)}
                    value={shipping}
                  >
                    {(['standard', 'express'] as const).map((speed) => (
                      <Label
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5',
                        )}
                        htmlFor={`${shippingLabelId}-${speed}`}
                        key={speed}
                      >
                        <span className="flex items-center gap-3">
                          <RadioGroupItem id={`${shippingLabelId}-${speed}`} value={speed} />
                          <span>
                            <span className="font-medium capitalize">{speed}</span>
                            <span className="block text-muted-foreground text-xs">
                              {SHIPPING[speed].eta}
                            </span>
                          </span>
                        </span>
                        <span className="font-medium">{formatUsdCents(SHIPPING[speed].price)}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard aria-hidden="true" className="h-4 w-4" /> Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                  <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-muted-foreground">
                    Card details are entered on Lemon Squeezy's PCI-compliant hosted checkout — this
                    app never sees them. Pressing{' '}
                    <span className="font-medium text-foreground">Pay</span> hands off securely and
                    returns here on success.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* right: order summary */}
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-4">
                {items.map((item) => (
                  <li className="flex gap-3" key={item.id}>
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted font-semibold text-muted-foreground text-xs"
                    >
                      {initials(item.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium text-sm">{item.name}</p>
                        <button
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-muted-foreground text-xs">{item.variant}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Badge className="text-xs" variant="outline">
                            {KIND_LABEL[item.kind]}
                          </Badge>
                          <span
                            aria-label={`Quantity of ${item.name}`}
                            className="flex items-center rounded-md border"
                            role="group"
                          >
                            <button
                              aria-label={`Decrease quantity of ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center text-muted-foreground disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              onClick={() => setQuantity(item.id, -1)}
                              type="button"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-7 text-center text-sm tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              aria-label={`Increase quantity of ${item.name}`}
                              className="flex h-7 w-7 items-center justify-center text-muted-foreground disabled:opacity-40"
                              disabled={item.quantity >= 99}
                              onClick={() => setQuantity(item.id, 1)}
                              type="button"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </span>
                        </span>
                        <span className="font-medium text-sm tabular-nums">
                          {formatUsdCents(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Separator />

              {/* coupon */}
              <div>
                <Label className="sr-only" htmlFor={couponFieldId}>
                  Discount code
                </Label>
                {coupon.status === 'applied' ? (
                  <Alert variant="success">
                    <Tag aria-hidden="true" className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between gap-3">
                      <span className="font-medium">
                        {coupon.code} · {coupon.label}
                      </span>
                      <button
                        aria-label="Remove discount code"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={clearCoupon}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      aria-describedby={
                        coupon.status === 'invalid' ? `${couponFieldId}-err` : undefined
                      }
                      aria-invalid={coupon.status === 'invalid'}
                      id={couponFieldId}
                      onChange={(event) => setCouponInput(event.target.value)}
                      placeholder="Discount code"
                      value={couponInput}
                    />
                    <Button
                      disabled={coupon.status === 'checking' || couponInput.trim().length === 0}
                      onClick={applyCoupon}
                      type="button"
                      variant="outline"
                    >
                      {coupon.status === 'checking' ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                )}
                {coupon.status === 'invalid' ? (
                  <p
                    className="mt-1 text-destructive text-xs"
                    id={`${couponFieldId}-err`}
                    role="alert"
                  >
                    "{coupon.code}" isn't a valid code. Try VYBE20 or LAUNCH50.
                  </p>
                ) : null}
              </div>

              <Separator />

              {/* totals — announced to assistive tech when they change */}
              <dl aria-atomic="true" aria-live="polite" className="space-y-1.5 text-sm">
                <Row label="Subtotal" value={formatUsdCents(totals.subtotal)} />
                {totals.discount > 0 ? (
                  <Row
                    emphasis="discount"
                    label="Discount"
                    value={`−${formatUsdCents(totals.discount)}`}
                  />
                ) : null}
                {hasPhysical ? (
                  <Row label="Shipping" value={formatUsdCents(totals.shippingCost)} />
                ) : null}
                <Row
                  label={`Tax (${(TAX_RATE * 100).toFixed(1)}%)`}
                  value={formatUsdCents(totals.tax)}
                />
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-semibold text-base">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatUsdCents(totals.total)}</dd>
                </div>
              </dl>

              {payError ? (
                <Alert variant="destructive">
                  <CircleAlert aria-hidden="true" className="h-4 w-4" />
                  <AlertTitle>Payment couldn't start</AlertTitle>
                  <AlertDescription>{payError}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                aria-busy={isProcessing}
                className="w-full"
                disabled={isProcessing}
                size="lg"
                type="submit"
              >
                {isProcessing ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Lock aria-hidden="true" className="h-4 w-4" /> Pay{' '}
                    {formatUsdCents(totals.total)}
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-muted-foreground text-xs">
                <Zap aria-hidden="true" className="h-3 w-3" /> Secure checkout · no card data
                touches this app
              </p>
            </CardContent>
          </Card>
        </form>

        {/* real integration contract — the point that makes this plug-and-play */}
        <DemoPlugInPanel>
          <p>
            This recipe is fully interactive with local React state — no backend needed to demo it.
            To take real payments in your VybeKiit app:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Replace <code>INITIAL_ITEMS</code> with your catalog — each item needs the Lemon
              Squeezy <code>variantId</code> from <code>@vybekiit/payments</code>.
            </li>
            <li>
              On <b>Pay</b>, <code>POST /api/checkout</code> with{' '}
              <code>{'{ items: [{ variantId, quantity }], email, couponCode }'}</code> → it returns{' '}
              <code>{'{ url }'}</code>; redirect the buyer there.
            </li>
            <li>
              Lemon Squeezy returns to <code>/success</code> (set via <code>APP_URL</code>). The
              webhook at <code>app/api/webhook/route.ts</code> (already shipped) verifies the
              signature, records the order in D1, and invites the buyer's GitHub via the gate — no
              extra work here.
            </li>
            <li>
              Coupons: validate <code>couponCode</code> server-side against the provider instead of
              the demo <code>COUPONS</code> map.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};
/** One label/value row in the totals list. */
