import { CreditCard, Package, RefreshCw, ShoppingCart, Truck } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Items',
    value: '3',
    detail: 'Ready for checkout',
    icon: <ShoppingCart className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Subtotal',
    value: '$147',
    detail: 'Before tax',
    icon: <CreditCard className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Shipping',
    value: 'Free',
    detail: 'Over threshold',
    icon: <Truck className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Saved',
    value: '2',
    detail: 'Move later',
    icon: <Package className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const cartItems = [
  {
    title: 'Line item rows',
    description: 'Product, quantity, price, remove, and save-for-later actions.',
    badge: 'Items',
  },
  {
    title: 'Coupon code',
    description: 'Apply discount, error, and success states.',
    badge: 'Coupon',
  },
  {
    title: 'Order summary',
    description: 'Subtotal, taxes, shipping, discounts, and total.',
    badge: 'Total',
  },
] as const;

const cartControls = [
  { title: 'Quantity updates', description: 'Shows loading when quantity changes.', badge: 'Qty' },
  {
    title: 'Empty cart state',
    description: 'Guides users back to product browsing.',
    badge: 'Empty',
  },
  {
    title: 'Checkout handoff',
    description: 'Moves the buyer to the configured checkout route.',
    badge: 'Checkout',
  },
] as const;

/**
 * Render a source-backed cart page recipe.
 *
 * @returns A cart review page with line items and totals.
 * @example
 * const element = <CartPage />;
 */
export const CartPage = () => {
  // TODO: Load cart line items and totals from the configured commerce source.
  // TODO: Save cart changes through the configured cart action.
  return (
    <DemoQuickWinPage
      active="orders"
      badge="Cart"
      detailItems={cartControls}
      detailTitle="Cart controls"
      listDescription="A checkout-ready cart with line items, totals, coupons, and empty state coverage."
      listItems={cartItems}
      listTitle="Cart review"
      metrics={metrics}
      primaryAction={{ label: 'Checkout', icon: <CreditCard className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Update cart',
        icon: <RefreshCw className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A generic cart route with line items, coupon handling, order summary, and checkout loading states."
      title="Cart review"
      transition="scale"
      variantDescription="Cart pages need editable quantities, readable totals, and clear checkout hierarchy."
      variantItems={cartControls}
      variantTitle="Cart component variants"
    />
  );
};
