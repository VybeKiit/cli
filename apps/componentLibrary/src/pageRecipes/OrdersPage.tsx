import { Download, Eye, Package, Receipt, Truck } from 'lucide-react';
import { DemoQuickWinPage } from './shared/DemoQuickWinPage';

const metrics = [
  {
    label: 'Orders',
    value: '24',
    detail: 'Last 30 days',
    icon: <Receipt className="h-5 w-5" />,
    tone: 'blue',
  },
  {
    label: 'In transit',
    value: '5',
    detail: 'Trackable',
    icon: <Truck className="h-5 w-5" />,
    tone: 'violet',
  },
  {
    label: 'Downloads',
    value: '18',
    detail: 'Digital access',
    icon: <Download className="h-5 w-5" />,
    tone: 'emerald',
  },
  {
    label: 'Returns',
    value: '1',
    detail: 'Needs review',
    icon: <Package className="h-5 w-5" />,
    tone: 'amber',
  },
] as const;

const orderItems = [
  {
    title: 'Order history',
    description: 'Order number, date, amount, status, and receipt action.',
    badge: 'History',
  },
  {
    title: 'Shipment tracking',
    description: 'Carrier status, expected delivery, and tracking link.',
    badge: 'Shipping',
  },
  {
    title: 'Digital access',
    description: 'Download links, license keys, and fulfillment state.',
    badge: 'Digital',
  },
] as const;

const orderControls = [
  {
    title: 'Download invoice',
    description: 'Expose invoices and receipts for accounting.',
    badge: 'Invoice',
  },
  {
    title: 'Request return',
    description: 'Start return, exchange, or refund workflows.',
    badge: 'Return',
  },
  {
    title: 'Reorder items',
    description: 'Add previous order items back into cart.',
    badge: 'Reorder',
  },
] as const;

/**
 * Render a source-backed orders page recipe.
 *
 * @returns An order history page for receipts, fulfillment, and tracking.
 * @example
 * const element = <OrdersPage />;
 */
export const OrdersPage = () => {
  // TODO: Load order history and fulfillment status from the configured commerce source.
  // TODO: Send invoice and reorder actions through the configured commerce actions.
  return (
    <DemoQuickWinPage
      active="orders"
      badge="Orders"
      detailItems={orderControls}
      detailTitle="Order actions"
      listDescription="A signed-in ecommerce route for tracking purchases and invoices."
      listItems={orderItems}
      listTitle="Order history"
      metrics={metrics}
      primaryAction={{ label: 'Download invoice', icon: <Download className="h-4 w-4" /> }}
      secondaryAction={{
        label: 'View details',
        icon: <Eye className="h-4 w-4" />,
        variant: 'outline',
      }}
      summary="An orders page with status badges, tracking, invoices, downloads, returns, and reorder actions."
      title="Orders"
      transition="fade"
      variantDescription="Order pages need status scanning, invoice access, and fulfillment clarity."
      variantItems={orderControls}
      variantTitle="Order component variants"
    />
  );
};
