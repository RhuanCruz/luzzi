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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useModal } from "@/components/ui/animated-modal";
import { useState } from "react";

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

export function WaitlistForm() {
  const { setOpen } = useModal();
  const [step, setStep] = useState(1);

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

  const analytics = form.watch("analytics");
  const measurements = form.watch("measurements");
  const stack = form.watch("stack");

  function onSubmit(values: FormValues) {
    console.log(values);
    toast.success("Respostas enviadas com sucesso!", {
      description: "Obrigado por compartilhar suas preferências.",
    });
    setOpen(false);
    form.reset();
    setStep(1);
  }

  const handleNext = async () => {
    let fieldsToValidate: Array<keyof FormValues> = [];

    if (step === 1) {
      fieldsToValidate = ["analytics", "analyticsOther"];
    } else if (step === 2) {
      fieldsToValidate = ["measurements", "measurementsOther"];
    }

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setStep(step + 1);
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

  const stackOptions = [
    { id: "nextjs", label: "Next.js / React" },
    { id: "vue", label: "Vue / Nuxt" },
    { id: "backend", label: "Backend / API" },
    { id: "mobile", label: "Mobile (React Native / Expo)" },
    { id: "other", label: "Outro" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Analytics */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Analytics atual</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Você usa algum analytics hoje?
              </p>
            </div>

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
          </div>
        )}

        {/* Step 2: Measurements */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">O que você quer medir</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O que você mais quer medir no seu app?
              </p>
            </div>

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
          </div>
        )}

        {/* Step 3: Stack */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Stack principal</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Qual stack você usa hoje?
              </p>
            </div>

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
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="flex-1"
            >
              Continuar
            </Button>
          ) : (
            <Button type="submit" className="flex-1">
              Finalizar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
