import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>This is where the card description is.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">This is the card content. Other content is added here.</p>
      </CardContent>
    </Card>
  );
}
