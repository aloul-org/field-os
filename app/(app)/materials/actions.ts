"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { sendEmail } from "@/lib/messaging/email";
import {
  materialSchema,
  supplierSchema,
  materialRequestSchema,
  type MaterialInput,
  type SupplierInput,
  type MaterialRequestInput,
} from "@/lib/validations/material";

type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WRITE_DENIED = "You don't have permission to make changes.";

function emptyToNull(v: string | undefined | null): string | null {
  return v && v.trim() ? v.trim() : null;
}

export async function saveMaterial(
  input: MaterialInput,
  id?: string
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("materials");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = materialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid material." };
  }
  const d = parsed.data;
  const supabase = createClient();

  const row = {
    name: d.name,
    sku: emptyToNull(d.sku),
    category: emptyToNull(d.category),
    unit: emptyToNull(d.unit),
    unit_cost: d.unit_cost ?? null,
    quantity_on_hand: d.quantity_on_hand,
    reorder_threshold: d.reorder_threshold,
    preferred_supplier_id: d.preferred_supplier_id ?? null,
  };

  if (id) {
    const { error } = await supabase
      .from("materials")
      .update(row)
      .eq("id", id)
      .eq("company_id", ctx.company.id);
    if (error) return { ok: false, error: "Could not save the material." };
    revalidatePath("/materials");
    return { ok: true, data: { id } };
  }

  const { data, error } = await supabase
    .from("materials")
    .insert({ company_id: ctx.company.id, ...row })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not add the material." };

  revalidatePath("/materials");
  return { ok: true, data: { id: data.id } };
}

export async function deleteMaterial(id: string): Promise<Result> {
  const ctx = await requireSection("materials");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { error } = await supabase
    .from("materials")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);
  if (error) return { ok: false, error: "Could not delete the material." };
  revalidatePath("/materials");
  return { ok: true, data: undefined };
}

export async function createSupplier(
  input: SupplierInput
): Promise<Result<{ id: string }>> {
  const ctx = await requireSection("materials");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = supplierSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid supplier." };
  }
  const d = parsed.data;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      company_id: ctx.company.id,
      name: d.name,
      contact_email: emptyToNull(d.contact_email),
      contact_phone: emptyToNull(d.contact_phone),
      notes: emptyToNull(d.notes),
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: "Could not add the supplier." };

  revalidatePath("/materials");
  return { ok: true, data: { id: data.id } };
}

/**
 * Draft a restock request and, where the supplier has an email on file, send a
 * clean request document via Resend (spec Module 6 — request-drafting, NOT live
 * ordering). Returns whether it was emailed so the UI can offer copy-the-text.
 */
export async function createMaterialRequest(
  input: MaterialRequestInput
): Promise<Result<{ emailed: boolean; requestText: string }>> {
  const ctx = await requireSection("materials");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = materialRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }
  const d = parsed.data;
  const supabase = createClient();

  const { data: material } = await supabase
    .from("materials")
    .select("id, name, unit, preferred_supplier_id")
    .eq("id", d.material_id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!material) return { ok: false, error: "Material not found." };

  const supplierId = d.supplier_id ?? material.preferred_supplier_id ?? null;
  let supplier: { name: string; contact_email: string | null } | null = null;
  if (supplierId) {
    const { data } = await supabase
      .from("suppliers")
      .select("name, contact_email")
      .eq("id", supplierId)
      .eq("company_id", ctx.company.id)
      .maybeSingle();
    supplier = data;
  }

  const { error } = await supabase.from("material_requests").insert({
    company_id: ctx.company.id,
    material_id: d.material_id,
    supplier_id: supplierId,
    quantity_requested: d.quantity_requested,
    notes: emptyToNull(d.notes),
    status: "draft",
  });
  if (error) return { ok: false, error: "Could not create the request." };

  const unit = material.unit ? ` ${material.unit}` : "";
  const requestText = [
    `Materials needed:`,
    `- ${material.name}: ${d.quantity_requested}${unit}`,
    d.notes ? `\nNotes: ${d.notes.trim()}` : "",
    `\nRequested by ${ctx.company.business_name}.`,
  ]
    .filter(Boolean)
    .join("\n");

  let emailed = false;
  if (supplier?.contact_email) {
    const res = await sendEmail({
      to: supplier.contact_email,
      subject: `Materials request from ${ctx.company.business_name}`,
      html: `<pre style="font-family:sans-serif">${requestText}</pre>`,
      replyTo: ctx.company.email,
    });
    emailed = res.ok;
    if (emailed) {
      await supabase
        .from("material_requests")
        .update({ status: "sent" })
        .eq("company_id", ctx.company.id)
        .eq("material_id", d.material_id)
        .eq("status", "draft");
    }
  }

  revalidatePath("/materials");
  return { ok: true, data: { emailed, requestText } };
}
