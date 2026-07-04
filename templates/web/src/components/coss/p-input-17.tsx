import { useId } from 'react';
import { Input } from '@/components/ui/input';

export default function Particle() {
  const id = useId();
  return (
    <Input
      className="read-only:bg-muted"
      defaultValue="This is a read-only input"
      id={id}
      readOnly={true}
      type="text"
    />
  );
}
