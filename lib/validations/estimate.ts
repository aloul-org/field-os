import { z } from "zod";

export const imageInputSchema = z.object({
  data: z.string().min(1),
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp", "image/gif"]),
});

/** Request to extract a draft estimate from text and/or photos. */
export const extractRequestSchema = z
  .object({
    description: z.string().optional(),
    customer_id: z.string().uuid().optional(),
    property_id: z.string().uuid().optional(),
    lead_id: z.string().uuid().optional(),
    images: z.array(imageInputSchema).max(4).optional(),
  })
  .refine((v) => (v.description && v.description.trim().length > 0) || (v.images && v.images.length > 0), {
    message: "Provide a description or at least one photo.",
  });

export const lineItemInputSchema = z.object({
  description: z.string().min(1, "Describe the line item"),
  quantity: z.number().nonnegative(),
  unit_price: z.number().nonnegative(),
  kind: z.enum(["labour", "material", "call_out", "other"]).optional(),
});

/** Persist a (possibly edited) estimate as a draft. */
export const createEstimateSchema = z.object({
  customer_id: z.string().uuid(),
  property_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  job_title: z.string().min(1, "Add a job title"),
  job_description_raw: z.string().optional().nullable(),
  summary_for_customer: z.string().min(1, "Add a customer summary"),
  line_items: z.array(lineItemInputSchema).min(1, "Add at least one line item"),
  estimated_duration_hours: z.number().nonnegative().optional().nullable(),
  ai_confidence: z.enum(["high", "medium", "low"]).optional().nullable(),
  ai_flags: z.array(z.string()).optional().default([]),
  photo_urls: z.array(z.string()).optional().default([]),
});

export type ImageInputZod = z.infer<typeof imageInputSchema>;
export type LineItemInput = z.infer<typeof lineItemInputSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
