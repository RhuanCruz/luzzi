'use client'

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/components/ui/terminal"
import { Input } from "@/components/ui/input";
import { TextAnimate } from "@/components/ui/text-animate"
import SocialSelector from "@/components/smoothui/social-selector"
import { ShimmerButton } from "@/components/ui/shimmer-button"
import { WordRotate } from "@/components/ui/word-rotate"
import { LineShadowText } from "@/components/ui/line-shadow-text"
import { Announcement, AnnouncementTag, AnnouncementTitle } from "@/components/ui/announcement";
import { ArrowUpRightIcon, Book, BarChart, Target, Code } from "lucide-react";
import {
  ExpandableScreen,
  ExpandableScreenContent,
  ExpandableScreenTrigger,
  useExpandableScreen,
} from "@/components/ui/expandable-screen"
import ToolbarExpandable from "@/components/ui/toolbar-expandable"
import { WaitlistFormSteps } from "@/components/waitlist-form-steps"
import { toast } from "sonner"
import { useState } from "react"
import { saveEmail } from "@/app/actions/waitlist"

function HomeContent() {
  const [email, setEmail] = useState("");
  const [toolbarExpanded, setToolbarExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { expand, collapse } = useExpandableScreen();

  const handleWaitlistClick = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsLoading(true);

    // Abre o expandable screen imediatamente (UI instantânea)
    expand();

    // Espera a animação do expandable screen completar antes de abrir o toolbar
    setTimeout(() => {
      setToolbarExpanded(true);
      setActiveStep("analytics");
    }, 300);

    // Salva o email no banco de dados em background
    const result = await saveEmail(email);
    setIsLoading(false);

    if (!result.success) {
      // Apenas log do erro, sem toast
      console.error("Erro ao cadastrar email:", result.error);
      // Se falhar, fecha tudo
      collapse();
      setToolbarExpanded(false);
      setActiveStep(null);
      return;
    }
  };

  const steps = [
    {
      id: "analytics",
      title: "Analytics atual",
      description: "Você usa algum analytics hoje?",
      icon: BarChart,
      content: <WaitlistFormSteps.Analytics />,
    },
    {
      id: "measurements",
      title: "O que medir",
      description: "O que você mais quer medir no seu app?",
      icon: Target,
      content: <WaitlistFormSteps.Measurements />,
    },
    {
      id: "stack",
      title: "Stack principal",
      description: "Qual stack você usa hoje?",
      icon: Code,
      content: <WaitlistFormSteps.Stack />,
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-16  sm:items-start z-10">
        <div className="flex flex-col gap-1">
          <div className="w-fit">
            <Announcement movingBorder className='w-fit'>
              <AnnouncementTitle>
                <span className="text-muted-foreground"   >Waitlist</span>
                <span className="text-primary text-md"   >Luzzi</span>

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
          <TypingAnimation>import luzzi from "@luzzi/analytics";</TypingAnimation>
          <TypingAnimation>luzzi.init("pk_live_xxx");</TypingAnimation>
          <TypingAnimation>luzzi.track("clicked_signup");</TypingAnimation>
        </Terminal>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full items-stretch sm:items-center bg-background">
          <Input
            type='email'
            placeholder={isSubscribed ? "Obrigado por se inscrever!" : "Email"}
            className="w-full bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubscribed}
          />
          <ShimmerButton
            onClick={handleWaitlistClick}
            disabled={isSubscribed || isLoading}
            className={`w-full sm:w-auto ${isSubscribed || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : isSubscribed ? "Obrigado!" : "Entrar na lista"}
          </ShimmerButton>
        </div>
        <SocialSelector />

        <ExpandableScreenContent className="bg-white dark:bg-black">
          <div className="flex h-full items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Me ajuda a te ajudar com mais 3 respostas
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suas respostas vão permitir que eu personalize o Luzzi para o seu caso de uso específico e te avise quando as features que você precisa estiverem prontas.
                </p>
              </div>

              <WaitlistFormSteps.Provider
                email={email}
                onGoToNextStep={() => {
                  const currentIndex = steps.findIndex((s) => s.id === activeStep);
                  if (currentIndex < steps.length - 1) {
                    setActiveStep(steps[currentIndex + 1].id);
                  }
                }}
                onFormComplete={() => {
                  collapse();
                  setToolbarExpanded(false);
                  setActiveStep(null);
                  setIsSubscribed(true);
                }}
              >
                <ToolbarExpandable
                  steps={steps}
                  badgeText=" "
                  expanded={toolbarExpanded}
                  onExpandedChange={setToolbarExpanded}
                  activeStep={activeStep}
                  onActiveStepChange={setActiveStep}
                />
              </WaitlistFormSteps.Provider>
            </div>
          </div>
        </ExpandableScreenContent>
      </main>
    </div >
  );
}

export default function Home() {
  return (
    <ExpandableScreen layoutId="waitlist-form" contentRadius="0px">
      <HomeContent />
    </ExpandableScreen>
  );
}
