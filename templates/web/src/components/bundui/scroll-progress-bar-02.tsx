import ScrollProgressBar from "../scroll-progress-bar";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

export default function ScrollProgressBarExample() {
  return (
    <>
      <ScrollProgressBar type="circle" />
      <div>
        <div className="flex h-screen items-center justify-center gap-2 text-xl">
          Scroll <ChevronDownIcon />
        </div>
        <div className="flex h-screen items-center justify-center gap-2 text-xl">
          Scroll <ChevronDownIcon />
        </div>
        <div className="flex h-screen items-center justify-center gap-2 text-xl">
          Scroll <ChevronUpIcon />
        </div>
      </div>
    </>
  );
}
