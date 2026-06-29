import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export default function ButtonIconSizes() {
  return (
    <div className="flex items-center gap-2">
      <Button size="icon-sm">
        <MoreHorizontal />
      </Button>
      <Button size="icon">
        <MoreHorizontal />
      </Button>
      <Button size="icon-lg">
        <MoreHorizontal />
      </Button>
    </div>
  );
}
