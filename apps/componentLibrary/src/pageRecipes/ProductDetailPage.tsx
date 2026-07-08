import { Eye, HeartPulse, Package, Plus, ShoppingCart } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Variant count',
    value: '6',
    detail: 'Color and size',
    icon: <Package className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Reviews',
    value: '4.8',
    detail: '128 ratings',
    icon: <HeartPulse className="h-5 w-5" />,
    tone: 'rose',
  },
  {
    label: 'Stock',
    value: '42',
    detail: 'Ready to ship',
    icon: <ShoppingCart className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Upsells',
    value: '3',
    detail: 'Related items',
    icon: <Eye className="h-5 w-5" />,
    tone: 'violet',
  },
] as const;

const detailItems = [
  {
    title: 'Image gallery',
    description: 'Primary image, thumbnail strip, and detail preview states.',
    badge: 'Media',
  },
  {
    title: 'Variant selector',
    description: 'Size, color, quantity, and availability options.',
    badge: 'Options',
  },
  {
    title: 'Related products',
    description: 'Recommendations, bundles, and recently viewed products.',
    badge: 'Upsell',
  },
] as const;

const purchaseControls = [
  {
    title: 'Quantity stepper',
    description: 'Increase, decrease, and disabled low-stock states.',
    badge: 'Qty',
  },
  {
    title: 'Review summary',
    description: 'Rating, count, and top review snippet.',
    badge: 'Reviews',
  },
  {
    title: 'Shipping estimate',
    description: 'Delivery, return, and warranty messaging.',
    badge: 'Shipping',
  },
] as const;

/**
 * Render a source-backed product detail page recipe.
 *
 * @returns A generic ecommerce product detail page.
 * @example
 * const element = <ProductDetailPage />;
 */
export const ProductDetailPage = () => {
  // TODO: Load product details, variants, reviews, and related products from the commerce source.
  // TODO: Send variant add-to-cart actions through the configured cart action.
  return (
    <DemoQuickWinPage
      active="products"
      badge="Product"
      detailItems={purchaseControls}
      detailTitle="Purchase controls"
      listDescription="The detail route buyers expect after clicking a product card."
      listItems={detailItems}
      listTitle="Product detail sections"
      metrics={metrics}
      primaryAction={{ label: 'Add to cart', icon: <ShoppingCart className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Save item',
        icon: <Plus className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A product detail page with gallery, variants, quantity, reviews, related products, and clear cart action."
      title="Product detail"
      transition="slide"
      variantDescription="Product detail pages need media, option controls, stock states, and review confidence."
      variantItems={purchaseControls}
      variantTitle="Product detail variants"
    />
  );
};
