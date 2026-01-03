'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal"
import { TextAnimate } from "@/components/ui/text-animate"
import { WordRotate } from "@/components/ui/word-rotate"
import { Announcement, AnnouncementTitle } from "@/components/ui/announcement";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16 sm:items-start z-10">
        <div className="flex flex-col gap-1">
          <div className="w-fit">
            <Announcement movingBorder className='w-fit'>
              <AnnouncementTitle>
                <span className="text-muted-foreground">Analytics</span>
                <span className="text-primary text-md">Luzzi</span>
              </AnnouncementTitle>
            </Announcement>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-start items-start sm:items-center">
            <TextAnimate animation="blurInUp" by="word" className="text-4xl">
              Analytics para
            </TextAnimate>
            <WordRotate className="text-4xl" words={["SaaS Builders", "Indie Hackers", "Vibe Coders"]} />
          </div>
          <TextAnimate animation="blurInUp" by="word" >
            Plug and Play Analytics.
            Métricas essenciais do seu app, em tempo real.
            Defina seus eventos no código e veja tudo em tempo real.
          </TextAnimate>
        </div>

        <Terminal>
          <TypingAnimation>import luzzi from "luzzi-analytics";</TypingAnimation>
          <TypingAnimation>luzzi.init("pk_live_xxx");</TypingAnimation>
          <TypingAnimation>luzzi.track("clicked_signup");</TypingAnimation>
        </Terminal>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto bg-white text-black hover:bg-zinc-200 px-8">
              Começar grátis
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800 px-8">
              Entrar
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
