import Image from "next/image";

import { TiltEffect } from "./tilt-effect";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TiltEffectExample() {
  return (
    <TiltEffect>
      <Card className="overflow-hidden rounded-md pt-0 shadow-none md:w-[280px]">
        <Image
          src="/images/products/list1.png"
          alt=""
          width={200}
          height={200}
          className="aspect-square size-full w-full object-cover transition-all duration-200 ease-linear"
          unoptimized
        />
        <CardContent className="space-y-1">
          <div className="text-lg font-semibold">T-shirt</div>
          <Badge variant="outline">Best Sellers</Badge>
        </CardContent>
      </Card>
    </TiltEffect>
  );
}
