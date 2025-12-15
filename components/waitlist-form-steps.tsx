"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { createContext, useContext, useState, ReactNode } from "react";
import { updateWaitlistData } from "@/app/actions/waitlist";
import { ArrowRight, Check } from "lucide-react";

const formSchema = z.object({
  analytics: z.enum(
    ["none", "google-analytics", "posthog", "mixpanel", "plausible", "other"]
  ).optional(),
  analyticsOther: z.string().optional(),
  measurements: z
    .array(z.string())
    .min(1, { message: "Selecione pelo menos uma opção." }),
  measurementsOther: z.string().optional(),
  stack: z
    .array(z.string())
    .min(1, { message: "Selecione pelo menos uma opção." }),
  stackOther: z.string().optional(),
}).refine(
  (data) => {
    if (data.analytics === "other" && !data.analyticsOther) {
      return false;
    }
    return true;
  },
  {
    message: "Por favor, especifique qual plataforma de analytics você usa.",
    path: ["analyticsOther"],
  }
).refine(
  (data) => {
    if (data.measurements?.includes("other") && !data.measurementsOther) {
      return false;
    }
    return true;
  },
  {
    message: "Por favor, especifique o que você quer medir.",
    path: ["measurementsOther"],
  }
).refine(
  (data) => {
    if (data.stack?.includes("other") && !data.stackOther) {
      return false;
    }
    return true;
  },
  {
    message: "Por favor, especifique qual stack você usa.",
    path: ["stackOther"],
  }
);

type FormValues = z.infer<typeof formSchema>;

// Context para compartilhar o form entre os steps
interface FormContextType {
  form: ReturnType<typeof useForm<FormValues>>;
  goToNextStep?: () => void;
}

const FormContext = createContext<FormContextType | null>(null);

export function WaitlistFormProvider({
  children,
  email,
  onGoToNextStep,
  onFormComplete,
}: {
  children: ReactNode;
  email: string;
  onGoToNextStep?: () => void;
  onFormComplete?: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      analytics: undefined,
      analyticsOther: "",
      measurements: [],
      measurementsOther: "",
      stack: [],
      stackOther: "",
    },
  });

  async function onSubmit(values: FormValues) {
    console.log("Form submitted:", values);

    // Atualiza os dados no banco de dados
    const result = await updateWaitlistData(email, {
      analytics: values.analytics,
      analyticsOther: values.analyticsOther,
      measurements: values.measurements,
      measurementsOther: values.measurementsOther,
      stack: values.stack,
      stackOther: values.stackOther,
    });

    if (!result.success) {
      toast.error(result.error || "Erro ao salvar dados");
      return;
    }

    toast.success("Respostas enviadas com sucesso!", {
      description: "Obrigado por compartilhar suas preferências.",
    });

    // Fecha o expandable screen após um pequeno delay
    setTimeout(() => {
      if (onFormComplete) {
        onFormComplete();
      }
      form.reset();
    }, 1000);
  }

  return (
    <FormContext.Provider value={{ form, goToNextStep: onGoToNextStep }}>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(onSubmit)(e);
          }}
        >
          {children}
        </form>
      </Form>
    </FormContext.Provider>
  );
}

function useFormContext() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within WaitlistFormProvider");
  }
  return context;
}

// Step 1: Analytics
function Analytics() {
  const { form, goToNextStep } = useFormContext();
  const analytics = form.watch("analytics");

  const handleContinue = async () => {
    const isValid = await form.trigger(["analytics", "analyticsOther"]);
    if (isValid && goToNextStep) {
      goToNextStep();
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="analytics"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-2"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="none" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Nenhum ainda
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="google-analytics" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Google Analytics
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="posthog" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    PostHog
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="mixpanel" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Mixpanel
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="plausible" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Plausible
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="other" />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">
                    Outro
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {analytics === "other" && (
        <FormField
          control={form.control}
          name="analyticsOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qual plataforma?</FormLabel>
              <FormControl>
                <Input placeholder="Nome da plataforma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-end mt-4">
        <Button
          type="button"
          onClick={handleContinue}
          className="group w-fit transition-all duration-200 hover:px-6"
        >
          <span className="hidden group-hover:inline mr-2">Continuar</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Step 2: Measurements
function Measurements() {
  const { form, goToNextStep } = useFormContext();
  const measurements = form.watch("measurements");

  const handleContinue = async () => {
    const isValid = await form.trigger(["measurements", "measurementsOther"]);
    if (isValid && goToNextStep) {
      goToNextStep();
    }
  };

  const measurementOptions = [
    { id: "events", label: "Eventos (cliques, ações)" },
    { id: "funnel", label: "Funil (signup, checkout)" },
    { id: "retention", label: "Retenção / uso recorrente" },
    { id: "errors", label: "Erros / fricções" },
    { id: "unknown", label: "Ainda não sei" },
    { id: "other", label: "Outro" },
  ];

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="measurements"
        render={() => (
          <FormItem>
            <div className="space-y-2">
              {measurementOptions.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="measurements"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== item.id
                                  )
                                );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {measurements?.includes("other") && (
        <FormField
          control={form.control}
          name="measurementsOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que você quer medir?</FormLabel>
              <FormControl>
                <Input placeholder="Descreva o que quer medir" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-end mt-4">
        <Button
          type="button"
          onClick={handleContinue}
          className="group w-fit transition-all duration-200 hover:px-6"
        >
          <span className="hidden group-hover:inline mr-2">Continuar</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Stack
function Stack() {
  const { form } = useFormContext();
  const stack = form.watch("stack");

  const stackOptions = [
    { id: "nextjs", label: "Next.js / React" },
    { id: "vue", label: "Vue / Nuxt" },
    { id: "backend", label: "Backend / API" },
    { id: "mobile", label: "Mobile (React Native / Expo)" },
    { id: "other", label: "Outro" },
  ];

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="stack"
        render={() => (
          <FormItem>
            <div className="space-y-2">
              {stackOptions.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="stack"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                  field.value?.filter(
                                    (value) => value !== item.id
                                  )
                                );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {stack?.includes("other") && (
        <FormField
          control={form.control}
          name="stackOther"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qual stack?</FormLabel>
              <FormControl>
                <Input placeholder="Nome da stack" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-end mt-4">
        <Button type="submit" className="group w-fit transition-all duration-200 hover:px-6">
          <span className="hidden group-hover:inline mr-2">Finalizar</span>
          <Check className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

export const WaitlistFormSteps = {
  Analytics,
  Measurements,
  Stack,
  Provider: WaitlistFormProvider,
};
