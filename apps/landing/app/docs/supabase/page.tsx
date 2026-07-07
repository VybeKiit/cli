import { CheckoutShell } from '@/components/checkout-shell';
import { SupabaseDocBrand, SupabaseDocContent } from '@/components/docs/SupabaseDocContent';

export const metadata = {
  title: 'Supabase Integration — VybeKiit',
  description:
    'How VybeKiit integrates Supabase for database, auth, and storage — and how the AI agent provisions it end-to-end.',
};

/**
 * Public Supabase integration doc — the URL the Supabase partner listing points at.
 * Describes the real integration (default DB/auth/storage + agent provisioning), so the
 * partner application's required "integration docs" link resolves to accurate content.
 */
const SupabaseDocPage = () => (
  <CheckoutShell headerBrand={<SupabaseDocBrand />} showCheckout={false}>
    <SupabaseDocContent />
  </CheckoutShell>
);

export default SupabaseDocPage;
