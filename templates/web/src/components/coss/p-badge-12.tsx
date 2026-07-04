import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function Particle() {
  return <Badge render={<Link href="/" />}>Badge</Badge>;
}
