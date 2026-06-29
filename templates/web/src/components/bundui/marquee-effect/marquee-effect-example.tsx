import { MarqueeEffect } from "./marquee-effect";

const images = [
  "/images/products/list1.png",
  "/images/products/list2.png",
  "/images/products/list3.png",
  "/images/products/list4.png",
  "/images/products/list5.png",
  "/images/products/list6.png",
  "/images/products/list7.png",
  "/images/products/list8.png",
  "/images/products/list9.png",
  "/images/products/list10.png"
];

export default function MarqueeEffectExample() {
  return (
    <MarqueeEffect gap={24}>
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Product ${i + 1}`}
          className="aspect-square w-32 rounded-md object-cover"
        />
      ))}
    </MarqueeEffect>
  );
}
