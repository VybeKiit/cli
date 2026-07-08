import { ScrollArea } from '@vybekiit/ui/scroll-area';

export default function Particle() {
  return (
    <ScrollArea className="max-w-96 rounded-lg border" scrollbarGutter={true}>
      <div className="flex w-max gap-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md bg-muted"
            key={String(i)}
          >
            <span className="font-medium text-sm">Item {i + 1}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
