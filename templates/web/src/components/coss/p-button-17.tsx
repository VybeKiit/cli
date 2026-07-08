import Link from 'next/link';
import { Button } from '@vybekiit/ui/button';

export default function Particle() {
  return <Button render={<Link href="/" />}>Link</Button>;
}
