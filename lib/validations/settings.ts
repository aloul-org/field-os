import { z } from "zod";

// RHF-bound — no .default()/.coerce.
export const companySettingsSchema = z.object({
  business_name: z.string().min(2, "Enter your business name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  default_hourly_rate: z.number().min(0).optional(),
  default_call_out_fee: z.number().min(0).optional(),
  vat_registered: z.boolean(),
  vat_number: z.string().optional(),
  payment_terms_days: z.number().int().min(0).max(120),
  monthly_overhead: z.number().min(0).optional(),
  language: z.enum(["en", "de"]),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;
