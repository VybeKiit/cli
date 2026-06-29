import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";

export default function ButtonLoading() {
  return (
    <Button disabled>
      <LoaderCircleIcon className="animate-spin" />
      Loading...
    </Button>
  );
}
