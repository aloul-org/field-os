"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import {
  pricingStepSchema,
  type PricingStepInput,
} from "@/lib/validations/onboarding";
import { useOnboarding } from "@/store/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function PricingStep() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const { pricing, company, setPricing } = useOnboarding();
  const currencySymbol = company.region === "DE" ? "€" : "£";

  const form = useForm<PricingStepInput>({
    resolver: zodResolver(pricingStepSchema),
    defaultValues: {
      default_hourly_rate: pricing.default_hourly_rate,
      default_call_out_fee: pricing.default_call_out_fee,
      vat_registered: pricing.vat_registered ?? true,
      vat_number: pricing.vat_number ?? "",
      payment_terms_days: pricing.payment_terms_days ?? 14,
    },
  });

  const vatRegistered = form.watch("vat_registered");

  function onSubmit(values: PricingStepInput) {
    setPricing(values);
    router.push("/onboarding/team");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("pricingTitle")}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="default_hourly_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("hourlyRate")} ({currencySymbol})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : e.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="default_call_out_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("callOutFee")} ({currencySymbol})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : e.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="vat_registered"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel>{t("vatRegistered")}</FormLabel>
                  <FormDescription>
                    {company.region === "DE" ? "19%" : "20%"}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {vatRegistered && (
            <FormField
              control={form.control}
              name="vat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("vatNumber")}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({tc("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="payment_terms_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("paymentTerms")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? undefined : e.target.valueAsNumber
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/onboarding/trade")}
            >
              {tc("back")}
            </Button>
            <Button type="submit" size="lg">
              {tc("continue")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
