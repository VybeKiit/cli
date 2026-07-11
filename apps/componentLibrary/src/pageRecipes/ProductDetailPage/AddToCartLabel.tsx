import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { formatUsdCents } from '../shared/formatUsdCents';

export const AddToCartLabel = ({
  adding,
  added,
  inStock,
  lineTotal,
}: {
  readonly adding: boolean;
  readonly added: boolean;
  readonly inStock: boolean;
  readonly lineTotal: number;
}) => {
  if (adding) {
    return (
      <>
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> Adding…
      </>
    );
  }
  if (added) {
    return (
      <>
        <Check aria-hidden="true" className="h-4 w-4" /> Added
      </>
    );
  }
  if (!inStock) {
    return 'Out of stock';
  }
  return (
    <>
      <ShoppingCart aria-hidden="true" className="h-4 w-4" /> Add to cart ·{' '}
      {formatUsdCents(lineTotal)}
    </>
  );
};
