'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Separator } from '@vybekiit/ui/separator';
import { ArrowRight, Loader2, Minus, Plus, ShoppingBag, Tag, Trash2, X } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoErrorState } from '../shared/DemoErrorState';
import { DemoLoadState } from '../shared/DemoLoadState';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdCents } from '../shared/formatUsdCents';
import { Row } from './Row';

/** Whether a line item is digital, physical, or a service. */
type ItemKind = 'digital' | 'physical' | 'service';

/** One cart line. Prices are integer cents. */
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

/** Realistic starting cart — mixed goods with real quantities. */
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

/** Coupons this demo recognizes. Real apps validate server-side against the provider. */
const COUPONS: Record<
  string,
  { readonly kind: 'percent' | 'flat'; readonly value: number; readonly label: string }
> = {
  VYBE20: { kind: 'percent', value: 20, label: '20% off' },
  LAUNCH50: { kind: 'flat', value: 5000, label: '$50 off' },
};

const TAX_RATE = 0.085;
const FREE_SHIPPING_THRESHOLD = 10_000;
const STANDARD_SHIPPING = 500;

const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();

type CouponState = {
  readonly status: 'idle' | 'checking' | 'applied' | 'invalid';
  readonly code: string;
  readonly kind?: 'percent' | 'flat';
  readonly value?: number;
  readonly label?: string;
};

type LoadStatus = 'ready' | 'loading' | 'error';
type CheckoutStatus = 'idle' | 'handoff';

/**
 * A production-shaped cart page: editable line items, live totals, coupon apply/error, empty
 * state, and checkout handoff. Shares coupon patterns with Checkout but stays cart-focused (no
 * payment form). Local React state only; see the integration panel for real wiring.
 *
 * @returns The cart recipe element.
 * @example
 * const element = <CartPage />;
 */
export const CartPage = () => {
  const couponFieldId = useId();

  const [status, setStatus] = useState<LoadStatus>('ready');
  const [items, setItems] = useState<readonly LineItem[]>(INITIAL_ITEMS);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponState>({ status: 'idle', code: '' });
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>('idle');

  const hasPhysical = useMemo(() => items.some((item) => item.kind === 'physical'), [items]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    let discount = 0;
    if (coupon.status === 'applied' && coupon.value !== undefined) {
      discount =
        coupon.kind === 'percent'
          ? Math.round((subtotal * coupon.value) / 100)
          : Math.min(coupon.value, subtotal);
    }
    const afterDiscount = Math.max(0, subtotal - discount);
    const shippingCost =
      hasPhysical && afterDiscount < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING : 0;
    const tax = Math.round(afterDiscount * TAX_RATE);
    return {
      subtotal,
      discount,
      shippingCost,
      tax,
      total: afterDiscount + shippingCost + tax,
      freeShipping: !hasPhysical || afterDiscount >= FREE_SHIPPING_THRESHOLD,
    };
  }, [items, coupon, hasPhysical]);

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

  const reloadCart = () => {
    setStatus('loading');
    globalThis.setTimeout(() => {
      setItems(INITIAL_ITEMS);
      clearCoupon();
      setCheckoutStatus('idle');
      setStatus('ready');
    }, 900);
  };

  const goCheckout = () => {
    setCheckoutStatus('handoff');
    globalThis.setTimeout(() => setCheckoutStatus('idle'), 1400);
  };

  // ---------- loading ----------
  if (status === 'loading') {
    return (
      <DemoRecipeFrame defaultTransition="scale" title="Cart motion pass">
        <DemoLoadState detail="Syncing line items and totals." title="Loading cart…" />
      </DemoRecipeFrame>
    );
  }

  // ---------- error ----------
  if (status === 'error') {
    return (
      <DemoRecipeFrame defaultTransition="scale" title="Cart motion pass">
        <DemoErrorState
          detail="Line items failed to load. Retry once the cart API is reachable."
          onRetry={reloadCart}
          title="Cart could not load"
        />
      </DemoRecipeFrame>
    );
  }

  // ---------- empty ----------
  if (items.length === 0) {
    return (
      <DemoRecipeFrame defaultTransition="scale" title="Cart motion pass">
        <section className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag aria-hidden="true" className="h-8 w-8" />
          </span>
          <h1 className="mt-6 font-bold text-2xl tracking-tight">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Add a product to see line items, coupons, and live totals.
          </p>
          <Button className="mt-6" onClick={reloadCart} type="button">
            <ShoppingBag aria-hidden="true" className="h-4 w-4" /> Restore demo cart
          </Button>
        </section>
      </DemoRecipeFrame>
    );
  }

  // ---------- ready ----------
  const isHandoff = checkoutStatus === 'handoff';
  return (
    <DemoRecipeFrame defaultTransition="scale" title="Cart motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              Cart
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Your cart</h1>
            <p className="max-w-xl text-muted-foreground">
              Adjust quantities or remove items — totals recalculate live. Try{' '}
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
              or clear every line to see the empty state.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={reloadCart} type="button" variant="outline">
              Reload cart
            </Button>
            <Button onClick={() => setStatus('error')} type="button" variant="ghost">
              Simulate error
            </Button>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-5">
                {items.map((item) => (
                  <li className="flex gap-3" key={item.id}>
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted font-semibold text-muted-foreground text-xs"
                    >
                      {initials(item.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">{item.name}</p>
                          <p className="text-muted-foreground text-xs">{item.variant}</p>
                        </div>
                        <button
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Row
                    label="Shipping"
                    value={totals.freeShipping ? 'Free' : formatUsdCents(totals.shippingCost)}
                  />
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

              {hasPhysical && !totals.freeShipping ? (
                <p className="text-muted-foreground text-xs">
                  Add{' '}
                  {formatUsdCents(FREE_SHIPPING_THRESHOLD - (totals.subtotal - totals.discount))}{' '}
                  more for free shipping.
                </p>
              ) : null}

              <Button
                aria-busy={isHandoff}
                className="w-full"
                disabled={isHandoff}
                onClick={goCheckout}
                size="lg"
                type="button"
              >
                {isHandoff ? (
                  <>
                    <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Going to
                    checkout…
                  </>
                ) : (
                  <>
                    Checkout <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-center text-muted-foreground text-xs">
                Secure handoff to the checkout recipe / hosted payment page.
              </p>
            </CardContent>
          </Card>
        </div>

        <DemoPlugInPanel>
          <p>
            This recipe is fully interactive with local React state — no backend needed to demo it.
            To wire a real multi-device cart:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset cart</code> so <code>carts</code> +{' '}
              <code>cart_items</code> exist (one open cart per buyer).
            </li>
            <li>
              Load the open cart with <code>GET /api/cart</code> →{' '}
              <code>
                {
                  '{ id, items: [{ id, product_id, variant_id, name, unit_price_cents, quantity }] }'
                }
              </code>
              .
            </li>
            <li>
              Quantity and remove: upsert / delete <code>cart_items</code> rows keyed by{' '}
              <code>(cart_id, product_id, variant_id)</code>.
            </li>
            <li>
              Coupons: validate server-side (or via the coupons preset) instead of the demo{' '}
              <code>COUPONS</code> map. Checkout CTA navigates to <code>/checkout</code> with the
              cart id.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

// TODO: Load open cart line items from GET /api/cart after apply-preset cart.
// TODO: Persist quantity/remove via cart_items upsert after apply-preset cart.
