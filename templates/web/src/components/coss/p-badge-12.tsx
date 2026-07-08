import Link from 'next/link';
import { Badge } from '@vybekiit/ui/badge';

export default function Particle() {
  return <Badge render={<Link href="/" />}>Badge</Badge>;
}
