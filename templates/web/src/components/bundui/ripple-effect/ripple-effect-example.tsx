import { RippleEffect } from "./ripple-effect";

export default function RippleEffectButton() {
  const cardClass =
    "flex aspect-square size-36 w-full select-none items-center justify-center text-xs font-medium tracking-widest uppercase text-muted-foreground";

  return (
    <div className="grid grid-cols-3 gap-4">
      <RippleEffect className="bg-muted" color="var(--color-blue-300)">
        <div className={cardClass}>blue</div>
      </RippleEffect>
      <RippleEffect className="bg-muted" color="var(--color-green-300)">
        <div className={cardClass}>green</div>
      </RippleEffect>
      <RippleEffect className="bg-muted" color="var(--color-purple-300)">
        <div className={cardClass}>purple</div>
      </RippleEffect>
    </div>
  );
}
