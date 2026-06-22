import { z } from "zod";

/** Material create/edit form (RHF-bound — no .default()/.coerce). */
export const materialSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(160),
  sku: z.string().trim().max(80).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  unit_cost: z.number().nonnegative().optional().nullable(),
  quantity_on_hand: z.number().nonnegative(),
  reorder_threshold: z.number().nonnegative(),
  preferred_supplier_id: z.string().uuid().optional().nullable(),
});

export const supplierSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(160),
  contact_email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  contact_phone: z.string().trim().max(40).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const materialRequestSchema = z.object({
  material_id: z.string().uuid(),
  quantity_requested: z.number().positive("Enter a quantity"),
  supplier_id: z.string().uuid().optional().nullable(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type MaterialInput = z.infer<typeof materialSchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
export type MaterialRequestInput = z.infer<typeof materialRequestSchema>;
