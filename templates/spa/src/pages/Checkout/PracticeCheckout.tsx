import { postJson } from '@/lib/fetchJson';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

/** Practice checkout — simulates a hosted payment page when no provider keys are set. */
const PracticeCheckout = () => {
  const navigate = useNavigate();
  const [productId, setProductId] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const nextProductId = new URLSearchParams(window.location.search).get('productId');
    setProductId(nextProductId === null ? '' : nextProductId);
  }, []);

  const handleComplete = async () => {
    if (!productId) {
      return;
    }
    setPending(true);
    setError('');
    const result = await postJson<{ ok: true; orderId?: string }>(
      '/api/checkout/practice/complete',
      { productId },
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    navigate({ to: '/' });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Practice checkout</CardTitle>
          <CardDescription>
            No payment keys configured — complete locally to simulate a purchase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">Plan: {productId || 'unknown'}</p>
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button disabled={pending || !productId} onClick={handleComplete}>
            {pending ? 'Completing…' : 'Complete purchase'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PracticeCheckout;
