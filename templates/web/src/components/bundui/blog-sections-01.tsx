import Link from "next/link";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock1Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

const posts = [
  {
    category: "Technology",
    title: "The Future of Web Development: Trends to Watch",
    description:
      "A practical guide to implementing robust security measures in your development workflow.",
    date: "August 1, 2024",
    author: "Alex Johnson",
    href: "#"
  },
  {
    category: "Design",
    title: "Mastering Responsive Design for All Devices",
    description:
      "A practical guide to implementing robust security measures in your development workflow.",
    date: "July 25, 2024",
    author: "Sarah Lee",
    href: "#"
  },
  {
    category: "Cloud",
    title: "Understanding Serverless Architectures: A Deep Dive",
    description:
      "A practical guide to implementing robust security measures in your development workflow.",
    date: "July 18, 2024",
    author: "Michael Chen",
    href: "#"
  },
  {
    category: "Security",
    title: "Essential Cybersecurity Tips for Developers",
    description:
      "A practical guide to implementing robust security measures in your development workflow.",
    date: "July 10, 2024",
    author: "Jessica Kim",
    href: "#"
  }
];

export default function BlogSection() {
  return (
    <section className="py-12 lg:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <header className="mb-6 space-y-2">
          <h2 className="font-heading text-3xl sm:text-4xl">Our Latest Articles</h2>
          <p className="text-muted-foreground lg:text-lg">
            Stay informed with our in-depth articles, guides, and thought leadership.
          </p>
        </header>

        <div className="grid gap-4">
          {posts.map((post, i) => (
            <Link href="#" className="group hover:bg-muted/50 block rounded-md border p-6" key={i}>
              <div className="space-y-2">
                <h4 className="flex flex-col gap-3 text-lg font-semibold lg:text-xl">
                  <Badge variant="outline">{post.category}</Badge>
                  {post.title}
                </h4>
                <p className="text-muted-foreground mb-4 text-base dark:text-gray-300">
                  {post.description}
                </p>
              </div>
              <div className="text-muted-foreground mt-auto flex items-center justify-between text-sm">
                <time className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock1Icon className="size-3" />
                  {post.date}
                </time>
                <span className="text-xs">By {post.author}</span>
              </div>
            </Link>
          ))}
          <div className="text-center">
            <Button variant="outline">Load More</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
