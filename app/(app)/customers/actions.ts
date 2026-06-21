"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import {
  customerSchema,
  propertySchema,
  type CustomerInput,
  type PropertyInput,
} from "@/lib/validations/customer";

type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const WRITE_DENIED = "You don't have permission to make changes.";

export async function createCustomer(
  input: CustomerInput
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSection("customers");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      company_id: ctx.company.id,
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      customer_type: parsed.data.customer_type,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Could not create customer." };
  revalidatePath("/customers");
  return { ok: true, data: { id: data.id } };
}

export async function updateCustomer(
  id: string,
  input: CustomerInput
): Promise<ActionResult> {
  const ctx = await requireSection("customers");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the form." };

  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      customer_type: parsed.data.customer_type,
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not save changes." };
  revalidatePath(`/customers/${id}`);
  revalidatePath("/customers");
  return { ok: true, data: undefined };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const ctx = await requireSection("customers");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const supabase = createClient();
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("company_id", ctx.company.id);

  if (error) return { ok: false, error: "Could not delete customer." };
  revalidatePath("/customers");
  return { ok: true, data: undefined };
}

export async function addProperty(
  input: PropertyInput
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireSection("customers");
  if (!canWrite(ctx.role)) return { ok: false, error: WRITE_DENIED };

  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the address." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      company_id: ctx.company.id,
      customer_id: parsed.data.customer_id,
      label: parsed.data.label || "Main property",
      address_line1: parsed.data.address_line1,
      address_line2: parsed.data.address_line2 || null,
      city: parsed.data.city || null,
      postcode: parsed.data.postcode || null,
      country: parsed.data.country || (ctx.company.region === "DE" ? "DE" : "UK"),
      access_notes: parsed.data.access_notes || null,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: "Could not add property." };
  revalidatePath(`/customers/${parsed.data.customer_id}`);
  return { ok: true, data: { id: data.id } };
}
