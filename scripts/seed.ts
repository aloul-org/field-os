/**
 * FieldOS AI seed script.
 *
 * Creates the demo account + "Apex Heating & Plumbing" with a realistic dataset
 * so the dashboard, CRM, dispatch board and finance views have something to show.
 *
 * Run with:  npm run seed
 * Requires:  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *            and the migrations in supabase/migrations applied.
 *
 * Safe to re-run: it deletes the existing demo user + company first.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database, LineItem } from "../lib/types/database";

// ── Minimal .env.local loader (no dotenv dependency) ────────────────────────
function loadEnv() {
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // env may already be set in the shell
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey || url.includes("placeholder")) {
  console.error(
    "✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first."
  );
  process.exit(1);
}

const db = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false },
});

const DEMO_EMAIL = "demo@fieldos.ai";
const DEMO_PASSWORD = "demo1234";
const VAT = 0.2;

// ── Helpers ─────────────────────────────────────────────────────────────────
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function priceLineItems(
  items: Array<Omit<LineItem, "line_total">>
): { line_items: LineItem[]; subtotal: number; vat_amount: number; total: number } {
  const line_items: LineItem[] = items.map((i) => ({
    ...i,
    line_total: money(i.quantity * i.unit_price),
  }));
  const subtotal = money(line_items.reduce((s, i) => s + i.line_total, 0));
  const vat_amount = money(subtotal * VAT);
  return { line_items, subtotal, vat_amount, total: money(subtotal + vat_amount) };
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}
function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 86400000).toISOString();
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function resetDemo() {
  // Delete existing demo auth user (cascades to company via owner FK).
  const { data: list } = await db.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    // Company is owned by this user (on delete cascade) — remove company rows too.
    await db.from("companies").delete().eq("owner_user_id", existing.id);
    await db.auth.admin.deleteUser(existing.id);
    console.log("• Removed existing demo account");
  }
}

async function main() {
  console.log("Seeding FieldOS AI demo data…");
  await resetDemo();

  // 1. Demo user
  const { data: created, error: userErr } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (userErr || !created.user) throw userErr ?? new Error("user create failed");
  const ownerUserId = created.user.id;
  console.log(`• Created ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // 2. Company
  const { data: company, error: companyErr } = await db
    .from("companies")
    .insert({
      business_name: "Apex Heating & Plumbing",
      owner_user_id: ownerUserId,
      trade: "plumbing",
      email: DEMO_EMAIL,
      phone: "+44 20 7946 0123",
      address: "12 Trade Park, London, EC1A 1BB",
      region: "UK",
      timezone: "Europe/London",
      language: "en",
      company_size: "6-20",
      default_hourly_rate: 65,
      default_call_out_fee: 90,
      vat_registered: true,
      vat_number: "GB123456789",
      vat_rate: VAT,
      monthly_overhead: 8000,
      payment_terms_days: 14,
      subscription_plan: "growth",
      subscription_status: "active",
    })
    .select("id")
    .single();
  if (companyErr || !company) throw companyErr ?? new Error("company failed");
  const companyId = company.id;

  // 3. Team members
  const { data: team, error: teamErr } = await db
    .from("team_members")
    .insert([
      {
        company_id: companyId,
        user_id: ownerUserId,
        name: "Sam Apex",
        email: DEMO_EMAIL,
        role: "owner",
        hourly_rate: 65,
        skills: ["plumbing", "hvac"],
        invite_accepted_at: daysAgo(120),
      },
      {
        company_id: companyId,
        name: "Dana Dispatch",
        email: "dana@apex.example",
        role: "dispatcher",
        invite_accepted_at: daysAgo(110),
      },
      {
        company_id: companyId,
        name: "Pat Pipes",
        email: "pat@apex.example",
        role: "technician",
        hourly_rate: 38,
        skills: ["plumbing"],
        invite_accepted_at: daysAgo(100),
      },
      {
        company_id: companyId,
        name: "Hank HVAC",
        email: "hank@apex.example",
        role: "technician",
        hourly_rate: 42,
        skills: ["hvac"],
        invite_accepted_at: daysAgo(95),
      },
    ])
    .select("id, name, role");
  if (teamErr || !team) throw teamErr ?? new Error("team failed");
  const techs = team.filter((t) => t.role === "technician");

  // 4. Customers + properties
  const customerNames = [
    "Margaret Hughes",
    "Riverside Cafe Ltd",
    "James Okafor",
    "Beatrice Lindqvist",
    "Highbury Lettings",
    "Tom Whitfield",
    "Priya Nair",
    "Gerald Banks",
  ];
  const customerRows = customerNames.map((name, i) => ({
    company_id: companyId,
    name,
    email: `${name.split(" ")[0].toLowerCase()}@example.com`,
    phone: `+44 7700 9000${String(i).padStart(2, "0")}`,
    customer_type: (i === 1 || i === 4 ? "commercial" : "residential") as
      | "residential"
      | "commercial",
    notes: i === 0 ? "Prefers morning appointments. Friendly dog on site." : null,
  }));
  const { data: customers, error: custErr } = await db
    .from("customers")
    .insert(customerRows)
    .select("id, name");
  if (custErr || !customers) throw custErr ?? new Error("customers failed");

  const propertyRows = customers.flatMap((c, i) => {
    const base = {
      company_id: companyId,
      customer_id: c.id,
      label: "Main property",
      address_line1: `${10 + i} Maple Street`,
      city: "London",
      postcode: `E${i + 1} 4AB`,
      country: "UK",
      lat: 51.5 + i * 0.01,
      lng: -0.12 + i * 0.01,
    };
    // Customers 1 and 4 get a second property (10 total).
    if (i === 1 || i === 4) {
      return [
        base,
        {
          ...base,
          label: "Second site",
          address_line1: `${50 + i} Oak Avenue`,
          postcode: `N${i + 1} 2CD`,
        },
      ];
    }
    return [base];
  });
  const { data: properties, error: propErr } = await db
    .from("properties")
    .insert(propertyRows)
    .select("id, customer_id");
  if (propErr || !properties) throw propErr ?? new Error("properties failed");
  const propFor = (customerId: string) =>
    properties.find((p) => p.customer_id === customerId)!.id;

  // 5. Leads (15, mixed)
  const sources = ["phone_call", "whatsapp", "website_widget", "manual"] as const;
  const scores = ["hot", "warm", "cold"] as const;
  const statuses = ["new", "contacted", "quoted", "converted", "lost"] as const;
  const leadRows = Array.from({ length: 15 }, (_, i) => ({
    company_id: companyId,
    customer_id: i < customers.length ? customers[i].id : null,
    source: pick([...sources], i),
    contact_name: i < customers.length ? customers[i].name : `Enquiry ${i}`,
    contact_phone: `+44 7700 8000${String(i).padStart(2, "0")}`,
    job_description: pick(
      [
        "Boiler not firing, no hot water since this morning",
        "Dripping tap in upstairs bathroom",
        "Annual boiler service due",
        "Radiator cold at the bottom, needs bleeding",
        "New bathroom installation quote",
      ],
      i
    ),
    score: pick([...scores], i),
    score_reason: pick(
      ["Urgent, address given", "Clear job, no urgency", "Price-shopping"],
      i
    ),
    status: i < 5 ? "new" : pick([...statuses], i),
    created_at: daysAgo(i),
  }));
  await db.from("leads").insert(leadRows);

  // 6. Estimates (12, ≥5 accepted)
  const estimateConfigs = Array.from({ length: 12 }, (_, i) => {
    const cust = pick(customers, i);
    const { line_items, subtotal, vat_amount, total } = priceLineItems([
      { description: "Call-out & diagnosis", quantity: 1, unit_price: 90, kind: "call_out" },
      { description: "Labour", quantity: 2 + (i % 3), unit_price: 65, kind: "labour" },
      { description: pick(["Replacement valve", "PRV", "Pump"], i), quantity: 1, unit_price: 40 + i * 8, kind: "material" },
    ]);
    const status = i < 5 ? "accepted" : pick(["sent", "rejected", "draft", "sent"], i);
    return {
      company_id: companyId,
      customer_id: cust.id,
      property_id: propFor(cust.id),
      estimate_number: `EST-2026-${String(i + 1).padStart(4, "0")}`,
      job_title: pick(["Boiler repair", "Leak fix", "Bathroom install", "Service"], i),
      trade_category: "plumbing",
      summary_for_customer: "Repair as discussed, parts and labour included.",
      line_items,
      subtotal,
      vat_rate: VAT,
      vat_amount,
      total_inc_vat: total,
      estimated_duration_hours: 2 + (i % 3),
      ai_confidence: pick(["high", "medium", "low"], i) as "high" | "medium" | "low",
      win_probability: 40 + ((i * 7) % 55),
      status: status as "draft" | "sent" | "accepted" | "rejected" | "expired",
      accepted_at: status === "accepted" ? daysAgo(20 - i) : null,
      sent_at: status !== "draft" ? daysAgo(25 - i) : null,
      created_at: daysAgo(30 - i),
    };
  });
  const { data: estimates } = await db
    .from("estimates")
    .insert(estimateConfigs)
    .select("id, customer_id, status, job_title, total_inc_vat, line_items");

  // 7. Jobs (8, across statuses) + appointments + reports
  const jobStatuses = [
    "unscheduled",
    "scheduled",
    "scheduled",
    "in_progress",
    "completed",
    "completed",
    "completed",
    "invoiced",
  ] as const;
  const jobRows = jobStatuses.map((status, i) => {
    const cust = pick(customers, i);
    return {
      company_id: companyId,
      customer_id: cust.id,
      property_id: propFor(cust.id),
      job_number: `JOB-2026-${String(i + 1).padStart(4, "0")}`,
      title: pick(["Boiler repair", "Leak fix", "Radiator install", "Service"], i),
      trade_category: "plumbing",
      description: "Work as per the accepted estimate.",
      status,
      priority: (i === 0 ? "emergency" : "normal") as "emergency" | "normal",
      estimated_duration_minutes: 120 + i * 15,
      created_at: daysAgo(15 - i),
    };
  });
  const { data: jobs } = await db
    .from("jobs")
    .insert(jobRows)
    .select("id, customer_id, status, title");

  if (jobs) {
    // Appointments for the two scheduled jobs, across both technicians.
    const scheduledJobs = jobs.filter((j) => j.status === "scheduled");
    const appts = scheduledJobs.map((j, i) => ({
      company_id: companyId,
      job_id: j.id,
      assigned_technician_id: pick(techs, i).id,
      scheduled_start: daysFromNow(i === 0 ? 0 : 1),
      scheduled_end: new Date(Date.now() + (i === 0 ? 2 : 26) * 3600000).toISOString(),
      status: "scheduled" as const,
      route_order: i + 1,
    }));
    if (appts.length) await db.from("appointments").insert(appts);

    // Reports + photos + signatures for completed jobs.
    const completed = jobs.filter((j) => j.status === "completed").slice(0, 3);
    for (const j of completed) {
      await db.from("job_reports").insert({
        job_id: j.id,
        technician_id: pick(techs, 0).id,
        voice_transcript: "Replaced the valve, bled the rads, all working now.",
        ai_formatted_report:
          "Replaced the faulty isolation valve and bled the radiators. System pressure restored and tested; all functioning correctly.",
        materials_used: [{ name: "Isolation valve", quantity: 1, unit_cost: 18 }],
        signed_by_name: "Customer",
      });
      await db.from("job_photos").insert([
        { job_id: j.id, photo_url: `${companyId}/demo/before.jpg`, photo_type: "before" },
        { job_id: j.id, photo_url: `${companyId}/demo/after.jpg`, photo_type: "after" },
      ]);
    }
  }

  // 8. Invoices (6, mixed)
  const invStatuses = ["paid", "paid", "sent", "overdue", "sent", "paid"] as const;
  const invoiceRows = invStatuses.map((status, i) => {
    const cust = pick(customers, i);
    const { line_items, subtotal, vat_amount, total } = priceLineItems([
      { description: "Labour", quantity: 2, unit_price: 65, kind: "labour" },
      { description: "Parts", quantity: 1, unit_price: 35 + i * 10, kind: "material" },
    ]);
    return {
      company_id: companyId,
      customer_id: cust.id,
      invoice_number: `INV-2026-${String(i + 1).padStart(4, "0")}`,
      line_items,
      subtotal,
      vat_rate: VAT,
      vat_amount,
      total_inc_vat: total,
      status,
      due_date: status === "overdue" ? daysAgo(5).slice(0, 10) : daysFromNow(10).slice(0, 10),
      paid_at: status === "paid" ? daysAgo(i + 1) : null,
      sent_at: daysAgo(i + 8),
      created_at: daysAgo(i + 10),
    };
  });
  await db.from("invoices").insert(invoiceRows);

  // 9. Materials (5, one below threshold)
  await db.from("materials").insert([
    { company_id: companyId, name: "15mm copper pipe (3m)", sku: "CU15", unit: "length", unit_cost: 12, quantity_on_hand: 24, reorder_threshold: 10 },
    { company_id: companyId, name: "Isolation valve", sku: "ISOV", unit: "item", unit_cost: 18, quantity_on_hand: 4, reorder_threshold: 8 },
    { company_id: companyId, name: "Boiler PRV", sku: "PRV3", unit: "item", unit_cost: 22, quantity_on_hand: 12, reorder_threshold: 5 },
    { company_id: companyId, name: "PTFE tape", sku: "PTFE", unit: "roll", unit_cost: 1.2, quantity_on_hand: 40, reorder_threshold: 15 },
    { company_id: companyId, name: "Radiator bleed key", sku: "RBK", unit: "item", unit_cost: 2.5, quantity_on_hand: 18, reorder_threshold: 6 },
  ]);

  // 10. Renewal plans (2, one due within 14 days)
  await db.from("renewal_plans").insert([
    {
      company_id: companyId,
      customer_id: customers[0].id,
      property_id: propFor(customers[0].id),
      plan_type: "Annual boiler service",
      interval_months: 12,
      next_due_date: daysFromNow(10).slice(0, 10),
      status: "active",
    },
    {
      company_id: companyId,
      customer_id: customers[2].id,
      property_id: propFor(customers[2].id),
      plan_type: "Annual boiler service",
      interval_months: 12,
      next_due_date: daysFromNow(120).slice(0, 10),
      status: "active",
    },
  ]);

  console.log("✓ Seed complete.");
  console.log(`  Log in at /login with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main().catch((e) => {
  console.error("✗ Seed failed:", e);
  process.exit(1);
});

// Avoid an unused-import error if the typed client narrows differently.
export type _Seed = SupabaseClient<Database>;
