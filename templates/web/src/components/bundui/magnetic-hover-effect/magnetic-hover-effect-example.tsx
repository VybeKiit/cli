import MagneticButton from "./magnetic-effect";
import { Button } from "@/components/ui/button";

export default function MagneticButtonExample() {
  return (
    <MagneticButton>
      <img
        className="aspect-square max-w-80 object-cover"
        src="/images/products/list3.png"
        alt="..."
      />
    </MagneticButton>
  );
}
