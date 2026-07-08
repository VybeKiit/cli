import { Filter, PackageSearch, Plus, Search, ShoppingCart } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Products',
    value: '48',
    detail: '12 featured',
    icon: <PackageSearch className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'Categories',
    value: '8',
    detail: 'Filter-ready',
    icon: <Filter className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Cart adds',
    value: '312',
    detail: '+14% this week',
    icon: <ShoppingCart className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Drafts',
    value: '5',
    detail: 'Need images',
    icon: <Plus className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const productItems = [
  {
    title: 'Starter kit license',
    description: 'Digital product card with badge, price, and CTA.',
    badge: '$49',
  },
  {
    title: 'Template bundle',
    description: 'Grouped bundle card with savings label and preview state.',
    badge: '$99',
  },
  {
    title: 'Consulting add-on',
    description: 'Service product card with booking and availability state.',
    badge: '$299',
  },
] as const;

const catalogControls = [
  {
    title: 'Filter by category',
    description: 'Product cards respond to categories and tags.',
    badge: 'Filter',
  },
  {
    title: 'Sort by price',
    description: 'Low-to-high and featured-first sorting controls.',
    badge: 'Sort',
  },
  {
    title: 'Quick add',
    description: 'Cart button shows loading and selected state.',
    badge: 'Cart',
  },
] as const;

/**
 * Render a source-backed product grid page recipe.
 *
 * @returns A generic ecommerce product card grid page.
 * @example
 * const element = <ProductGridPage />;
 */
export const ProductGridPage = () => {
  // TODO: Load products, prices, and categories from the configured commerce source.
  // TODO: Send add-to-cart actions through the configured cart action.
  return (
    <DemoQuickWinPage
      active="products"
      badge="Products"
      detailItems={catalogControls}
      detailTitle="Catalog controls"
      listDescription="Reusable product cards for digital products, services, subscriptions, and physical goods."
      listItems={productItems}
      listTitle="Product card view"
      metrics={metrics}
      primaryAction={{ label: 'Add product', icon: <Plus className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'Search catalog',
        icon: <Search className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="A generic ecommerce catalog with product cards, filters, sorting, prices, badges, and quick add actions."
      title="Product catalog"
      transition="fade"
      variantDescription="Product grids need card density, responsive filters, and obvious price/action hierarchy."
      variantItems={catalogControls}
      variantTitle="Product card variants"
    />
  );
};
