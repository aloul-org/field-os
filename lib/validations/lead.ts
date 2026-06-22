import { z } from "zod";

// Channels a human can pick when entering a lead by hand. The full LeadSource
// enum also includes machine-only channels (phone_call, website_widget, etc.).
export const manualLeadSourceSchema = z.enum([
  "manual",
  "phone_call",
  "whatsapp",
  "sms",
  "email",
  "facebook",
  "instagram",
]);

export const leadStatusSchema = z.enum([
  "new",
  "contacted",
  "quoted",
  "converted",
  "lost",
  "spam",
]);

/** Manual lead entry form (RHF-bound — no .default()/.coerce, see conventions). */
export const createLeadSchema = z
  .object({
    contact_name: z.string().trim().min(1, "Add a name").max(120),
    contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
    contact_email: z
      .string()
      .trim()
      .email("Enter a valid email")
      .optional()
      .or(z.literal("")),
    source: manualLeadSourceSchema,
    job_description: z.string().trim().max(4000).optional().or(z.literal("")),
    address: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine(
    (v) => Boolean(v.contact_phone || v.contact_email || v.job_description),
    { message: "Add a phone, email or a description so the lead is actionable." }
  );

export const updateLeadStatusSchema = z.object({
  id: z.string().uuid(),
  status: leadStatusSchema,
  // Required when marking a lead lost — captured for win/loss reporting.
  lost_reason: z.string().trim().max(280).optional(),
});

export const assignLeadSchema = z.object({
  id: z.string().uuid(),
  // null = unassign.
  assigned_to: z.string().uuid().nullable(),
});

/** Public website-widget submission. safeParse'd in the API route, not RHF. */
export const widgetSubmitSchema = z.object({
  widget_public_key: z.string().uuid(),
  contact_name: z.string().trim().min(1).max(120),
  contact_phone: z.string().trim().max(40).optional(),
  contact_email: z.string().trim().email().max(160).optional(),
  message: z.string().trim().min(1).max(4000),
  address: z.string().trim().max(300).optional(),
  // Honeypot — bots fill hidden fields; humans leave it empty.
  company_website: z.string().max(0).optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type WidgetSubmitInput = z.infer<typeof widgetSubmitSchema>;
