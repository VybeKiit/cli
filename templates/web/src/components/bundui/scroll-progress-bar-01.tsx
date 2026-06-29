import ScrollProgressBar from "../scroll-progress-bar";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export default function ScrollProgressBarExample() {
  return (
    <>
      <ScrollProgressBar type="bar" />
      <div>
        <div className="flex h-screen items-center justify-center gap-2 text-xl">
          Scroll <ChevronDownIcon className="text-muted-foreground size-4" />
        </div>
        <div className="flex h-screen items-center justify-center gap-2 text-xl">
          Scroll <ChevronDownIcon className="text-muted-foreground size-4" />
        </div>
        <div className="flex h-screen items-center justify-center gap-2 text-xl">
          Scroll <ChevronUpIcon className="text-muted-foreground size-4" />
        </div>
      </div>
    </>
  );
}
