import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Checkout — VybeKiit',
  description: 'Buy VybeKiit and get an invite to the private repo the moment payment clears.',
};

/**
 * Legacy `/checkout` URL. Checkout is an in-page dialog on the homepage so buyers
 * never wait on a second document load. Deep links and old CTAs land on `/?checkout=1`.
 */
const CheckoutPage = () => {
  redirect('/?checkout=1');
};

export default CheckoutPage;
