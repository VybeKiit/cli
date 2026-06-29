import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "lucide-react";

export default function BadgeWithIcon() {
  return (
    <Badge variant="outline">
      <CheckIcon className="size-3 text-green-700" />
      Completed
    </Badge>
  );
}
