import { PracticeCheckoutForm } from '@/components/practice-checkout-form';

/**
 * Practice checkout — simulates a hosted payment page when no provider keys are
 * set. Completes fulfillment locally and returns to pricing with a success toast.
 */
export default async function PracticeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  return <PracticeCheckoutForm productId={productId} />;
}
