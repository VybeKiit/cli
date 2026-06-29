import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function SelectDemo() {
  return (
    <Select defaultValue="3">
      <SelectTrigger className="w-[200px]">
        <span className="inline-flex items-center space-x-2">
          Status: <SelectValue placeholder="Select framework" />
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">
          <Badge variant="outline">In Progress</Badge>
        </SelectItem>
        <SelectItem value="2">
          <Badge variant="outline">Completed</Badge>
        </SelectItem>
        <SelectItem value="3">
          <Badge variant="outline">Pending</Badge>
        </SelectItem>
        <SelectItem value="4">
          <Badge variant="destructive">Cancelled</Badge>
        </SelectItem>
        <SelectItem value="5">
          <Badge variant="destructive">Rejected</Badge>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
