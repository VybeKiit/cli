"use client";

import TextGradientScroll from "./text-gradient-scroll";
import { type LenisRef, ReactLenis } from "lenis/react";
import { useEffect, useRef } from "react";
import { cancelFrame, frame } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function TextGradientScrollExample() {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(data: { timestamp: number }) {
      const time = data.timestamp;
      lenisRef.current?.lenis?.raf(time);
    }

    frame.update(update, true);

    return () => cancelFrame(update);
  }, []);

  return (
    <>
      <ReactLenis root options={{ autoRaf: false }} ref={lenisRef} />
      <div>
        <div className="flex h-screen items-center justify-center">
          Scroll Down <ChevronDown className="text-muted-foreground ms-1 size-4" />
        </div>
        <div className="flex flex-col gap-10">
          <TextGradientScroll
            className="text-xl"
            text="The text gradient scroll component is designed to enhance user interaction by providing a visually dynamic effect as the user scrolls through the text. Unlike static text, this effect offers a more engaging visual experience with smooth color transitions that change as the text is scrolled. The text gradient scroll component is designed to enhance user interaction by providing a visually dynamic effect as the user scrolls through the text. Unlike static text, this effect offers a more engaging visual experience with smooth color transitions that change as the text is scrolled."
          />
          <TextGradientScroll
            className="text-xl text-green-500"
            text="The text gradient scroll component is designed to enhance user interaction by providing a visually dynamic effect as the user scrolls through the text. Unlike static text, this effect offers a more engaging visual experience with smooth color transitions that change as the text is scrolled."
          />
        </div>
        <div className="flex h-screen items-center justify-center">
          Scroll Up <ChevronUp className="text-muted-foreground ms-1 size-4" />
        </div>
      </div>
    </>
  );
}
