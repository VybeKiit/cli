import { CheckoutForm } from '@/components/checkout-form';
import { CheckoutShell } from '@/components/checkout-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRICE } from '@/data/site';

export const metadata = {
  title: 'Checkout — VybeKiit',
  description: 'Buy VybeKiit and get an invite to the private repo the moment payment clears.',
};

/**
 * Checkout page — wraps the GitHub-username + email form in the marketing shell.
 * The form drives the hosted-checkout redirect; this page is just the framing.
 */
export default function CheckoutPage() {
  return (
    <CheckoutShell>
      <section className="mx-auto max-w-md px-6 py-20">
        <Card>
          <CardHeader>
            <CardTitle>Get VybeKiit — {PRICE.display}</CardTitle>
            <CardDescription>
              Enter the GitHub account to grant access to, then continue to secure payment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CheckoutForm />
          </CardContent>
        </Card>
      </section>
    </CheckoutShell>
  );
}
