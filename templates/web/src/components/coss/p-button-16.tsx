import { DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Particle() {
  return (
    <Button>
      <DownloadIcon aria-hidden="true" />
      Download
    </Button>
  );
}
