import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function Particle() {
  return (
    <Button disabled={true}>
      <Spinner />
      Loading...
    </Button>
  );
}
