import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AvatarDefault() {
  return (
    <Avatar>
      <AvatarImage src="https://www.tobybelhome.com/user.png" />
      <AvatarFallback>TB</AvatarFallback>
    </Avatar>
  );
}
