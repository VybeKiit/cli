import { PracticeCheckoutForm } from '@/components/practice-checkout-form';

/**
 * Practice checkout — simulates a hosted payment page when no provider keys are
 * set. Completes fulfillment locally and returns to pricing with a success toast.
 *
 * @param props - Practice checkout query params from Next.js.
 * @returns The local practice checkout page.
 * @example
 * <PracticeCheckoutPage searchParams={searchParams} />
 */
const PracticeCheckoutPage = async ({
  searchParams,
}: {
  readonly searchParams: Promise<{ productId?: string }>;
}) => {
  const { productId } = await searchParams;
  return <PracticeCheckoutForm productId={productId} />;
};

export default PracticeCheckoutPage;
