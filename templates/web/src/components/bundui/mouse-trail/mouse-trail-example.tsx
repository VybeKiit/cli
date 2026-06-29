import { MouseTrail } from "./mouse-trail";

export default function Page() {
  return (
    <MouseTrail
      dotColor="var(--color-primary)"
      dotSize={5}
      spacing={10}
      trailLength={20}
      fadeDuration={500}
    />
  );
}
