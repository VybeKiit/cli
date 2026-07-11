'use client';

import { Alert, AlertDescription } from '@vybekiit/ui/alert';
import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Label } from '@vybekiit/ui/label';
import { Separator } from '@vybekiit/ui/separator';
import {
  Check,
  CircleAlert,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoErrorState } from '../shared/DemoErrorState';
import { DemoPlugInPanel } from '../shared/DemoPlugInPanel';
import { DemoRecipeFrame } from '../shared/DemoRecipeFrame';
import { formatUsdCents } from '../shared/formatUsdCents';
import { AddToCartLabel } from './AddToCartLabel';

/** One sellable variant (size, plan, or color). Prices in integer cents. */
type Variant = {
  readonly id: string;
  readonly label: string;
  readonly priceCents: number;
  readonly stock: number;
};

/** Related product strip item. */
type RelatedProduct = {
  readonly id: string;
  readonly name: string;
  readonly priceCents: number;
  readonly initials: string;
};

const PRODUCT = {
  id: 'founder-hoodie',
  name: 'Founder Hoodie',
  description:
    'Heavyweight 400gsm charcoal hoodie with embroidered VybeKiit mark. Soft fleece interior, reinforced seams, and a relaxed fit for long build sessions.',
  rating: 4.8,
  reviewCount: 128,
  features: [
    '400gsm French terry',
    'Embroidered chest mark',
    'Ships in 2–4 business days',
    'Free exchanges within 30 days',
  ],
} as const;

const DEFAULT_VARIANT: Variant = { id: 'm', label: 'Size M', priceCents: 6500, stock: 28 };

const VARIANTS: readonly Variant[] = [
  { id: 's', label: 'Size S', priceCents: 6500, stock: 12 },
  DEFAULT_VARIANT,
  { id: 'l', label: 'Size L', priceCents: 6500, stock: 0 },
  { id: 'xl', label: 'Size XL', priceCents: 6900, stock: 6 },
];

const RELATED: readonly RelatedProduct[] = [
  { id: 'desk-mat', name: 'Studio Desk Mat', priceCents: 4200, initials: 'DM' },
  { id: 'icon-pack', name: 'Brand Icon Pack', priceCents: 2900, initials: 'IP' },
  { id: 'starter-kit', name: 'Starter Kit License', priceCents: 19_900, initials: 'VK' },
  { id: 'sticker-set', name: 'Build Log Stickers', priceCents: 1200, initials: 'BS' },
];

/**
 * A production-shaped product detail page: variant picker, quantity, stock-aware CTA, related
 * products, and live add-to-cart feedback. Out-of-stock variants disable the primary action.
 * Local React state only; see the integration panel for real wiring.
 *
 * @returns The product detail recipe element.
 * @example
 * const element = <ProductDetailPage />;
 */
export const ProductDetailPage = () => {
  const variantGroupId = useId();
  const qtyLabelId = useId();
  const toastId = useId();
  const relatedHeadingId = useId();

  const [variantId, setVariantId] = useState<string>('m');
  const [quantity, setQuantity] = useState(1);
  const [forceOutOfStock, setForceOutOfStock] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loadError, setLoadError] = useState(false);

  const variant = useMemo(
    () => VARIANTS.find((item) => item.id === variantId) ?? DEFAULT_VARIANT,
    [variantId],
  );

  const stock = forceOutOfStock ? 0 : variant.stock;
  const inStock = stock > 0;
  const lineTotal = variant.priceCents * quantity;

  const setQty = (delta: number) => {
    setQuantity((current) => Math.min(Math.max(1, current + delta), Math.max(1, stock || 1)));
  };

  const addToCart = () => {
    if (!inStock) {
      return;
    }
    setAdding(true);
    setAdded(false);
    // Simulated async cart write. Real apps POST cart_items with product + variant ids.
    globalThis.setTimeout(() => {
      setAdding(false);
      setAdded(true);
      setCartCount((count) => count + quantity);
      setToast(`${PRODUCT.name} (${variant.label}) × ${quantity} added`);
      globalThis.setTimeout(() => {
        setToast(null);
        setAdded(false);
      }, 2600);
    }, 700);
  };

  if (loadError) {
    return (
      <DemoRecipeFrame defaultTransition="slide" title="Product detail motion pass">
        <DemoErrorState
          detail="Details, variants, and related products failed to load. Retry when the products API is
              reachable."
          onRetry={() => setLoadError(false)}
          title="Product could not load"
        />
      </DemoRecipeFrame>
    );
  }

  return (
    <DemoRecipeFrame defaultTransition="slide" title="Product detail motion pass">
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Badge className="w-fit" variant="secondary">
              Product
            </Badge>
            <h1 className="font-bold text-3xl tracking-tight md:text-4xl">{PRODUCT.name}</h1>
            <p className="flex items-center gap-2 text-muted-foreground text-sm">
              <span className="inline-flex items-center gap-1 text-foreground">
                <Star aria-hidden="true" className="h-4 w-4 fill-amber-400 text-amber-400" />
                {PRODUCT.rating}
              </span>
              <span>·</span>
              <span>{PRODUCT.reviewCount} reviews</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              aria-atomic="true"
              aria-live="polite"
              className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 font-medium text-sm"
            >
              <ShoppingCart aria-hidden="true" className="h-4 w-4" />
              Cart
              <Badge>{cartCount}</Badge>
            </span>
            <Button
              onClick={() => setForceOutOfStock((value) => !value)}
              size="sm"
              type="button"
              variant="outline"
            >
              {forceOutOfStock ? 'Restore stock' : 'Simulate out of stock'}
            </Button>
            <Button onClick={() => setLoadError(true)} size="sm" type="button" variant="ghost">
              Simulate error
            </Button>
          </div>
        </div>

        {toast ? (
          <Alert className="mb-4" id={toastId} variant="success">
            <Check aria-hidden="true" className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{toast}</span>
              <button
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setToast(null)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* gallery placeholder */}
          <div className="space-y-3">
            <div
              aria-hidden="true"
              className="flex aspect-square items-center justify-center rounded-xl bg-muted font-semibold text-5xl text-muted-foreground md:text-6xl"
            >
              FH
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['Front', 'Back', 'Detail', 'Pack'].map((label) => (
                <div
                  aria-hidden="true"
                  className="flex aspect-square items-center justify-center rounded-md border bg-card text-muted-foreground text-xs"
                  key={label}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* purchase panel */}
          <div className="space-y-6">
            <p className="text-muted-foreground">{PRODUCT.description}</p>

            <div>
              <p className="font-semibold text-3xl tabular-nums" aria-live="polite">
                {formatUsdCents(lineTotal)}
              </p>
              <p className="text-muted-foreground text-sm">
                {formatUsdCents(variant.priceCents)} each
                {quantity > 1 ? ` · qty ${quantity}` : ''}
              </p>
            </div>

            <div>
              <p className="mb-2 font-medium text-sm" id={variantGroupId}>
                Variant
              </p>
              <div aria-labelledby={variantGroupId} className="flex flex-wrap gap-2" role="group">
                {VARIANTS.map((item) => {
                  const selected = item.id === variantId;
                  const itemOut = forceOutOfStock || item.stock === 0;
                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm transition-colors',
                        selected
                          ? 'border-primary bg-primary/5 font-medium'
                          : 'hover:border-foreground/30',
                        itemOut && 'opacity-60',
                      )}
                      key={item.id}
                      onClick={() => {
                        setVariantId(item.id);
                        setQuantity(1);
                      }}
                      type="button"
                    >
                      {item.label}
                      {item.stock === 0 && !forceOutOfStock ? (
                        <span className="ml-1 text-muted-foreground text-xs">(out)</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="mb-2 block" id={qtyLabelId}>
                Quantity
              </Label>
              <span
                aria-labelledby={qtyLabelId}
                className="inline-flex items-center rounded-md border"
                role="group"
              >
                <button
                  aria-label="Decrease quantity"
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                  disabled={!inStock || quantity <= 1}
                  onClick={() => setQty(-1)}
                  type="button"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm tabular-nums">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground disabled:opacity-40"
                  disabled={!inStock || quantity >= stock}
                  onClick={() => setQty(1)}
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              {inStock ? (
                <>
                  <Package aria-hidden="true" className="h-4 w-4 text-emerald-600" />
                  <span>
                    <span className="font-medium text-emerald-700">{stock} in stock</span>
                    <span className="text-muted-foreground"> · ready to ship</span>
                  </span>
                </>
              ) : (
                <>
                  <CircleAlert aria-hidden="true" className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">Out of stock</span>
                </>
              )}
            </div>

            <Button
              aria-busy={adding}
              className="w-full"
              disabled={!inStock || adding}
              onClick={addToCart}
              size="lg"
              type="button"
            >
              <AddToCartLabel
                added={added}
                adding={adding}
                inStock={inStock}
                lineTotal={lineTotal}
              />
            </Button>

            <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-muted-foreground text-sm">
              <Truck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Standard shipping 4–6 business days. Express available at checkout.</p>
            </div>

            <Separator />

            <ul className="grid gap-2 sm:grid-cols-2">
              {PRODUCT.features.map((feature) => (
                <li className="flex items-start gap-2 text-sm" key={feature}>
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section aria-labelledby={relatedHeadingId} className="mt-12">
          <h2 className="mb-4 font-semibold text-xl" id={relatedHeadingId}>
            Related products
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {RELATED.map((item) => (
              <li key={item.id}>
                <Card className="h-full">
                  <CardHeader className="flex-row items-center gap-3 space-y-0 pb-2">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted font-semibold text-muted-foreground text-xs"
                    >
                      {item.initials}
                    </span>
                    <CardTitle className="text-sm leading-snug">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-sm tabular-nums">
                      {formatUsdCents(item.priceCents)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <DemoPlugInPanel>
          <p>
            This recipe is fully interactive with local React state — no backend needed to demo it.
            To wire a real product detail route:
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Run <code>vybekiit apply-preset products</code>. Load one product via{' '}
              <code>GET /api/products/:slug</code> including nested <code>product_variants</code> (
              <code>id</code>, <code>name</code>, <code>price_cents</code>, <code>stock</code>).
            </li>
            <li>
              Map variants to the selector; disable the CTA when <code>stock === 0</code> (or omit
              the variant).
            </li>
            <li>
              On <b>Add to cart</b>, after <code>vybekiit apply-preset cart</code>, upsert{' '}
              <code>cart_items</code> with{' '}
              <code>{'{ cart_id, product_id, variant_id, name, unit_price_cents, quantity }'}</code>
              .
            </li>
            <li>
              Related products: query other published rows from the same catalog (limit 4) by
              category or tags in <code>metadata</code>.
            </li>
          </ol>
        </DemoPlugInPanel>
      </main>
    </DemoRecipeFrame>
  );
};

/** Primary CTA label for the add-to-cart button (avoids nested ternaries in JSX). */

// TODO: Load product + variants from GET /api/products/:slug after apply-preset products.
// TODO: POST selected variant to cart_items after apply-preset cart.
