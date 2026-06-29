import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

const items = [
  {
    id: "1",
    title: "Product Information",
    content:
      "Our flagship product combines cutting-edge technology with sleek design. Built with premium materials, it offers unparalleled performance and reliability."
  },
  {
    id: "2",
    title: "Shipping Details",
    content:
      "We offer worldwide shipping through trusted courier partners. Standard delivery takes 3-5 business days, while express shipping ensures delivery within 1-2 business days."
  },
  {
    id: "3",
    title: "Return Policy",
    content:
      "We stand behind our products with a comprehensive 30-day return policy. If you&apos;re not completely satisfied, simply return the item in its original condition."
  }
];

export default function AccordionDemo() {
  return (
    <Accordion type="single" className="w-full" defaultValue="1">
      {items.map((item) => (
        <AccordionItem value={item.id} key={item.id} className="py-2">
          <AccordionTrigger className="font-semibold">{item.title}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground pb-2">{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
