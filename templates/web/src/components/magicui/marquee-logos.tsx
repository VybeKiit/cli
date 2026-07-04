import { cn } from "@/lib/utils"
import { Marquee } from "@/components/magicui/marquee"

const logos = [
  { name: "Microsoft", img: "/logos/marquee/microsoft.svg" },
  { name: "Apple", img: "/logos/marquee/apple.svg", invertOnDark: true },
  { name: "Google", img: "/logos/marquee/google.svg" },
  { name: "Meta", img: "/logos/marquee/meta.svg" },
  { name: "LinkedIn", img: "/logos/marquee/linkedin.svg" },
  { name: "X", img: "/logos/marquee/x.svg", invertOnDark: true },
] as const

const Logo = ({
  name,
  img,
  invertOnDark,
}: {
  name: string
  img: string
  invertOnDark?: boolean
}) => {
  return (
    <div
      className={cn(
        "flex h-12 w-28 shrink-0 cursor-pointer items-center justify-center px-2"
      )}
    >
      <img
        src={img}
        alt={name}
        className={cn(
          "h-8 w-auto max-w-full object-contain",
          invertOnDark && "dark:invert"
        )}
        loading="lazy"
        decoding="async"
      />
    </div>
  )
}

export default function MarqueeLogos() {
  return (
    <div className="bg-background relative flex size-full flex-col items-center justify-center gap-4 overflow-hidden rounded-lg border py-20 md:shadow-xl">
      <Marquee className="[--gap:3rem]">
        {logos.map((logo) => (
          <Logo key={logo.name} {...logo} />
        ))}
      </Marquee>
      <div className="dark:from-background pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white"></div>
      <div className="dark:from-background pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white"></div>
    </div>
  )
}
