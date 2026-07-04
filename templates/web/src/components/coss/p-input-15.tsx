import { Input } from '@/components/ui/input';

export default function Particle() {
  return (
    <Input
      aria-label="Email"
      className="border-transparent bg-muted shadow-none before:hidden"
      placeholder="Email"
      type="email"
    />
  );
}
