import { Button } from '@vybekiit/ui/button';
import { Spinner } from '@vybekiit/ui/spinner';

export default function Particle() {
  return (
    <Button disabled={true}>
      <Spinner />
      Loading...
    </Button>
  );
}
