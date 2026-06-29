import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function SelectDemo() {
  return (
    <Select defaultValue="3">
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select user" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel className="text-muted-foreground py-1 ps-2 text-xs font-normal">
            Select a user
          </SelectLabel>
          <SelectItem value="1">
            <span className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src="/media/avatars/3.png" alt="@reui" />
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
              <span>Alan Bold</span>
            </span>
          </SelectItem>
          <SelectItem value="2">
            <span className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src="/media/avatars/4.png" alt="@reui" />
                <AvatarFallback>EJ</AvatarFallback>
              </Avatar>
              <span>Ethan James</span>
            </span>
          </SelectItem>
          <SelectItem value="3">
            <span className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src="/media/avatars/10.png" alt="@reui" />
                <AvatarFallback>NK</AvatarFallback>
              </Avatar>
              <span>Nina Clark</span>
            </span>
          </SelectItem>
          <SelectItem value="4">
            <span className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src="/media/avatars/12.png" alt="@reui" />
                <AvatarFallback>JA</AvatarFallback>
              </Avatar>
              <span>Sean Otto</span>
            </span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
