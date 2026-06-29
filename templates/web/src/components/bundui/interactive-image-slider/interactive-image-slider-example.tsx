import React from "react";
import { InteractiveImageSlider } from "./interactive-image-slider";

const images = [
  "/images/products/list1.png",
  "/images/products/list2.png",
  "/images/products/list3.png"
];

export default function InteractiveImageSliderExample() {
  return <InteractiveImageSlider items={images} />;
}
