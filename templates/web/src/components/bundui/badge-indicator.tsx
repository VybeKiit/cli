import { Badge } from "@/components/ui/badge";

export default function BadgeIndicator() {
  return (
    <div className="flex items-center justify-center gap-2">
      <Badge variant="outline">
        <span className="me-0.5 size-2 rounded-full bg-green-500" />
        Success
      </Badge>
      <Badge variant="outline">
        <span className="me-0.5 size-2 rounded-full bg-indigo-500" />
        Info
      </Badge>
      <Badge variant="outline">
        <span className="bg-destructive me-0.5 size-2 rounded-full" />
        Destructive
      </Badge>
    </div>
  );
}
