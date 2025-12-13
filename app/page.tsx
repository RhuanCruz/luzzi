import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal"
import { Input } from "@/components/ui/input";
import { TextAnimate } from "@/components/ui/text-animate"

import { WordRotate } from "@/components/ui/word-rotate"
import SocialSelector from "@/components/smoothui/social-selector"


export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16  sm:items-start z-10">
        <div className="flex flex-col gap-1">

          <div className="flex gap-2 justify-start items-center">
            <TextAnimate animation="blurInUp" by="word" className="text-4xl">
              Analytics simples para
            </TextAnimate>
            <WordRotate className="text-4xl" words={["SaaS Builders", "Indie Hackers", "Vibe Coders"]} />

          </div>
          <TextAnimate animation="blurInUp" by="word" >
            Feito para vibe coders e indie SaaS.
            Instale rápido e volte a construir.
          </TextAnimate>
        </div>
        <Terminal>
          <TypingAnimation>import luzzi from "@luzzi/analytics";</TypingAnimation>
          <TypingAnimation>luzzi.init("pk_live_xxx");</TypingAnimation>
          <TypingAnimation>luzzi.track("clicked_signup");</TypingAnimation>
        </Terminal>
        <div className="flex justify-between gap-4 w-full">
          <Input type='email' placeholder="Email" className="w-full bg-white" />
          <Button variant="outline">Inscrever</Button>
        </div>
        <SocialSelector />

      </main>
    </div >
  );
}
