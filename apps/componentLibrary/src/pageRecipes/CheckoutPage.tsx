import { CreditCard, LockKeyhole, MapPin, Receipt, Truck } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Steps',
    value: '3',
    detail: 'Contact, ship, pay',
    icon: <Truck className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Secure',
    value: 'TLS',
    detail: 'Payment handoff',
    icon: <LockKeyhole className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Total',
    value: '$147',
    detail: 'Ready to pay',
    icon: <Receipt className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Address',
    value: 'Valid',
    detail: 'Shipping ready',
    icon: <MapPin className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const checkoutItems = [
  {
    title: 'Contact information',
    description: 'Email, phone, account, and guest checkout states.',
    badge: 'Contact',
  },
  {
    title: 'Shipping method',
    description: 'Address, shipping speed, taxes, and delivery estimate.',
    badge: 'Shipping',
  },
  {
    title: 'Payment handoff',
    description: 'Provider handoff, summary, and order confirmation.',
    badge: 'Payment',
  },
] as const;

const checkoutControls = [
  {
    title: 'Save address',
    description: 'Persist shipping details for signed-in users.',
    badge: 'Address',
  },
  {
    title: 'Validate payment',
    description: 'Show provider errors without hiding the retry action.',
    badge: 'Payment',
  },
  {
    title: 'Confirm order',
    description: 'Disable duplicate submits while order is being created.',
    badge: 'Order',
  },
] as const;

/**
 * Render a source-backed checkout page recipe.
 *
 * @returns A checkout page with contact, shipping, payment, and summary sections.
 * @example
 * const element = <CheckoutPage />;
 */
export const CheckoutPage = () => {
  // TODO: Load checkout session and order summary from the configured commerce provider.
  // TODO: Submit checkout through the configured payment provider.
  return (
    <DemoQuickWinPage
      active="orders"
      badge="Checkout"
      detailItems={checkoutControls}
      detailTitle="Checkout controls"
      listDescription="A generic checkout flow for physical, digital, or subscription products."
      listItems={checkoutItems}
      listTitle="Checkout steps"
      metrics={metrics}
      primaryAction={{ label: 'Pay now', icon: <CreditCard className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Review order',
        icon: <Receipt className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A checkout route with contact details, shipping choices, payment handoff, and order summary states."
      title="Checkout"
      transition="slide"
      variantDescription="Checkout pages need clear steps, provider handoff, totals, and duplicate-submit protection."
      variantItems={checkoutControls}
      variantTitle="Checkout component variants"
    />
  );
};
