import { Button } from "@/components/ui/button";
import { LoaderCircleIcon } from "lucide-react";

export default function ButtonLoading() {
  return (
    <Button disabled size="icon">
      <LoaderCircleIcon className="animate-spin" />
    </Button>
  );
}
