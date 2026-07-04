import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function Particle() {
  return (
    <div className="flex flex-col gap-2">
      <Textarea placeholder="Type your message here" />
      <Button className="self-start">Send</Button>
    </div>
  );
}
