import { z } from "zod";

// RHF-bound — no .default()/.coerce (keeps Zod input and output types identical
// so the resolver generics line up). Defaults are applied via form
// defaultValues and the server actions.
export const customerSchema = z.object({
  name: z.string().min(2, "Enter a customer name"),
  email: z.string().email("Enter a valid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  customer_type: z.enum(["residential", "commercial"]),
  notes: z.string().optional(),
});

export const propertySchema = z.object({
  customer_id: z.string().uuid(),
  label: z.string().optional(),
  address_line1: z.string().min(2, "Enter the address"),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  access_notes: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type PropertyInput = z.infer<typeof propertySchema>;
