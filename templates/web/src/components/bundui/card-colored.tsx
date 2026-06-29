import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full max-w-sm border-purple-300 bg-purple-50 shadow-none dark:border-purple-800 dark:bg-purple-950">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is where the card description is.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">This is the card content. Other content is added here.</p>
        </CardContent>
      </Card>
      <Card className="w-full max-w-sm border-sky-300 bg-sky-50 shadow-none dark:border-sky-800 dark:bg-sky-950">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is where the card description is.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">This is the card content. Other content is added here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
