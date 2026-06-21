import { z } from "zod";

export const tradeEnum = z.enum([
  "plumbing",
  "electrical",
  "hvac",
  "roofing",
  "landscaping",
  "cleaning",
  "pest_control",
  "appliance_repair",
  "pool_services",
  "general_contracting",
  "other",
]);

export const regionEnum = z.enum(["UK", "DE"]);
export const languageEnum = z.enum(["en", "de"]);
export const companySizeEnum = z.enum(["solo", "2-5", "6-20", "21-100"]);
export const planEnum = z.enum(["starter", "growth", "pro", "enterprise"]);
export const teamRoleEnum = z.enum([
  "owner",
  "admin",
  "dispatcher",
  "estimator",
  "technician",
  "viewer",
]);

// NOTE: these two schemas are bound directly to react-hook-form, so they must
// NOT use .default()/.coerce — those make Zod's input type differ from its
// output type, which breaks the resolver's generic inference. Defaulting and
// number coercion are handled in the components / server action instead.
export const companyStepSchema = z.object({
  business_name: z.string().min(2, "Enter your business name"),
  owner_name: z.string().min(2, "Enter your name"),
  phone: z.string().optional(),
  address: z.string().optional(),
  region: regionEnum,
  language: languageEnum,
});

export const tradeStepSchema = z.object({
  trade: tradeEnum,
  company_size: companySizeEnum,
});

export const pricingStepSchema = z.object({
  default_hourly_rate: z.number().min(0).optional(),
  default_call_out_fee: z.number().min(0).optional(),
  vat_registered: z.boolean(),
  vat_number: z.string().optional(),
  payment_terms_days: z.number().int().min(0).max(120),
});

export const teamInviteSchema = z.object({
  name: z.string().min(2, "Enter a name"),
  email: z.string().email("Enter a valid email"),
  role: teamRoleEnum,
});

/** Full payload submitted at the final onboarding step to create everything. */
export const createCompanySchema = z.object({
  company: companyStepSchema,
  trade: tradeStepSchema,
  pricing: pricingStepSchema,
  team: z.array(teamInviteSchema).default([]),
  plan: planEnum.default("growth"),
});

export type CompanyStepInput = z.infer<typeof companyStepSchema>;
export type TradeStepInput = z.infer<typeof tradeStepSchema>;
export type PricingStepInput = z.infer<typeof pricingStepSchema>;
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
