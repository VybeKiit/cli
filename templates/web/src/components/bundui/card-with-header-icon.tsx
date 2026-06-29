import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers2Icon } from "lucide-react";

export default function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="grow">
        <div className="flex gap-4">
          <Layers2Icon className="text-muted-foreground" />
          <div className="space-y-2">
            <CardTitle>Card Title</CardTitle>
            <CardDescription>This is where the card description is.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This is the card content. Other content is added here.</p>
      </CardContent>
    </Card>
  );
}
