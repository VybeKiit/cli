import { TypingAnimation } from "@/components/magicui/typing-animation"

export default function Component() {
  return (
    <TypingAnimation
      words={["Fast typing", "Slow delete"]}
      typeSpeed={50}
      deleteSpeed={150}
      pauseDelay={2000}
      loop
    />
  )
}
