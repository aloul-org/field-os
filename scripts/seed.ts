/**
 * FieldOS AI — full demo seeder.
 *
 * Creates a demo login + "Apex Heating & Plumbing" with a realistic dataset that
 * touches EVERY application table, so every screen (dashboard, CRM, dispatch,
 * field reports, invoicing, finance, materials, reviews, coach, notifications)
 * has something to show.
 *
 * Run with:  npm run seed
 * Requires:  NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *            and the migrations in supabase/migrations applied.
 *
 * Safe to re-run: it deletes the existing demo user + company first.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  LOGIN:  demo@fieldos.ai  /  demo1234   (owner, full access) │
 * └─────────────────────────────────────────────────────────────┘
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
function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * 3600000).toISOString();
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function resetDemo() {
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

  // ── 1. Demo user ──────────────────────────────────────────────────────────
  const { data: created, error: userErr } = await db.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (userErr || !created.user) throw userErr ?? new Error("user create failed");
  const ownerUserId = created.user.id;
  console.log(`• Created ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

  // ── 2. Company ────────────────────────────────────────────────────────────
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
      google_business_profile_url: "https://g.page/r/apex-heating-demo",
      google_place_id: "ChIJDemoPlaceIdApexHeating0000",
      voice_receptionist_enabled: true,
      voice_greeting:
        "Thanks for calling Apex Heating & Plumbing — tell me what you need and I'll get you sorted.",
      widget_enabled: true,
    })
    .select("id")
    .single();
  if (companyErr || !company) throw companyErr ?? new Error("company failed");
  const companyId = company.id;

  // ── 3. Team members ───────────────────────────────────────────────────────
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
        name: "Eddie Estimator",
        email: "eddie@apex.example",
        role: "estimator",
        invite_accepted_at: daysAgo(105),
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
      {
        company_id: companyId,
        name: "Vera Viewer",
        email: "vera@apex.example",
        role: "viewer",
        invite_accepted_at: null, // pending invite — exercises the not-yet-accepted path
      },
    ])
    .select("id, name, role, user_id");
  if (teamErr || !team) throw teamErr ?? new Error("team failed");
  const techs = team.filter((t) => t.role === "technician");
  console.log(`• ${team.length} team members`);

  // ── 4. Suppliers ──────────────────────────────────────────────────────────
  const { data: suppliers, error: supErr } = await db
    .from("suppliers")
    .insert([
      {
        company_id: companyId,
        name: "City Plumbing Supplies",
        contact_email: "trade@cityplumbing.example",
        contact_phone: "+44 20 7946 1000",
        notes: "Account #4471 — next-day delivery on stock items.",
      },
      {
        company_id: companyId,
        name: "Wolseley Trade Counter",
        contact_email: "orders@wolseley.example",
        contact_phone: "+44 20 7946 1200",
        notes: "Best price on copper and boilers.",
      },
    ])
    .select("id, name");
  if (supErr || !suppliers) throw supErr ?? new Error("suppliers failed");
  console.log(`• ${suppliers.length} suppliers`);

  // ── 5. Customers + properties ─────────────────────────────────────────────
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
  console.log(`• ${customers.length} customers, ${properties.length} properties`);

  // ── 6. Leads ──────────────────────────────────────────────────────────────
  const sources = ["phone_call", "whatsapp", "website_widget", "manual", "email"] as const;
  const scores = ["hot", "warm", "cold"] as const;
  const statuses = ["new", "contacted", "quoted", "converted", "lost", "spam"] as const;
  const leadRows = Array.from({ length: 15 }, (_, i) => ({
    company_id: companyId,
    customer_id: i < customers.length ? customers[i].id : null,
    source: pick([...sources], i),
    contact_name: i < customers.length ? customers[i].name : `Enquiry ${i}`,
    contact_phone: `+44 7700 8000${String(i).padStart(2, "0")}`,
    contact_email: i < customers.length ? `lead${i}@example.com` : null,
    raw_message: "Hi, I think my boiler has packed in — can someone come out?",
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
    address: `${10 + i} Maple Street, London`,
    score: pick([...scores], i),
    score_reason: pick(
      ["Urgent, address given", "Clear job, no urgency", "Price-shopping"],
      i
    ),
    status: i < 5 ? "new" : pick([...statuses], i),
    assigned_to: i % 3 === 0 ? team[1].id : null, // some assigned to the dispatcher
    created_at: daysAgo(i),
  }));
  const { data: leads, error: leadErr } = await db
    .from("leads")
    .insert(leadRows)
    .select("id, status, source, contact_phone, customer_id");
  if (leadErr || !leads) throw leadErr ?? new Error("leads failed");
  console.log(`• ${leads.length} leads`);

  // ── 7. Calls (AI receptionist) — linked to the phone leads ─────────────────
  const phoneLeads = leads.filter((l) => l.source === "phone_call").slice(0, 5);
  const callStatuses = ["completed", "completed", "voicemail", "missed", "forwarded_to_human"] as const;
  const urgencies = ["emergency", "urgent", "normal", "flexible"] as const;
  const callRows = phoneLeads.map((l, i) => ({
    company_id: companyId,
    lead_id: l.id,
    twilio_call_sid: `CA${Date.now().toString(36)}${i}demo`,
    caller_number: l.contact_phone ?? "+44 7700 800000",
    direction: "inbound" as const,
    status: pick([...callStatuses], i),
    duration_seconds: 45 + i * 30,
    recording_url: i % 2 === 0 ? `${companyId}/demo/call-${i}.mp3` : null,
    transcript:
      "Caller: My boiler's making a banging noise and there's no hot water.\nAI: Understood — what's the address, and is it an emergency?",
    ai_summary:
      "Boiler fault, no hot water. Caller wants someone out today. Address captured.",
    urgency: pick([...urgencies], i),
    started_at: daysAgo(i),
    ended_at: new Date(Date.now() - i * 86400000 + (45 + i * 30) * 1000).toISOString(),
  }));
  await db.from("calls").insert(callRows);
  console.log(`• ${callRows.length} calls`);

  // ── 8. Estimates (12, ≥5 accepted) ────────────────────────────────────────
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
      job_description_raw: "Customer described a boiler/leak issue over the phone.",
      summary_for_customer: "Repair as discussed, parts and labour included.",
      line_items,
      subtotal,
      vat_rate: VAT,
      vat_amount,
      total_inc_vat: total,
      estimated_duration_hours: 2 + (i % 3),
      ai_confidence: pick(["high", "medium", "low"], i) as "high" | "medium" | "low",
      ai_flags: i % 4 === 0 ? ["Assumed standard parts — confirm boiler model on site."] : [],
      win_probability: 40 + ((i * 7) % 55),
      win_probability_factors: ["Priced near your recent accepted quotes", "Repeat customer"],
      status: status as "draft" | "sent" | "accepted" | "rejected" | "expired",
      accepted_at: status === "accepted" ? daysAgo(20 - i) : null,
      sent_at: status !== "draft" ? daysAgo(25 - i) : null,
      created_at: daysAgo(30 - i),
    };
  });
  const { data: estimates, error: estErr } = await db
    .from("estimates")
    .insert(estimateConfigs)
    .select("id, customer_id, status, job_title, total_inc_vat");
  if (estErr || !estimates) throw estErr ?? new Error("estimates failed");
  console.log(`• ${estimates.length} estimates`);

  // ── 9. Follow-up log (chasing sent estimates) ─────────────────────────────
  const sentEstimates = estimates.filter((e) => e.status === "sent" || e.status === "accepted");
  const followUpRows = sentEstimates.slice(0, 4).map((e, i) => ({
    estimate_id: e.id,
    channel: pick(["email", "whatsapp", "sms"] as const, i),
    message_body: `Hi, just following up on your quote for "${e.job_title}". Happy to answer any questions!`,
    sent_at: daysAgo(18 - i),
  }));
  if (followUpRows.length) await db.from("follow_up_log").insert(followUpRows);
  console.log(`• ${followUpRows.length} follow-ups`);

  // ── 10. Jobs (8, across statuses) ─────────────────────────────────────────
  const acceptedByCustomer = new Map<string, string>();
  estimates
    .filter((e) => e.status === "accepted")
    .forEach((e) => {
      if (e.customer_id && !acceptedByCustomer.has(e.customer_id)) {
        acceptedByCustomer.set(e.customer_id, e.id);
      }
    });

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
      estimate_id: acceptedByCustomer.get(cust.id) ?? null,
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
  const { data: jobs, error: jobErr } = await db
    .from("jobs")
    .insert(jobRows)
    .select("id, customer_id, status, title");
  if (jobErr || !jobs) throw jobErr ?? new Error("jobs failed");
  console.log(`• ${jobs.length} jobs`);

  // Link a couple of converted leads to jobs (closes the lead → job loop).
  const convertedLeads = leads.filter((l) => l.status === "converted").slice(0, 2);
  for (let i = 0; i < convertedLeads.length; i++) {
    await db
      .from("leads")
      .update({ converted_to_job_id: jobs[i].id })
      .eq("id", convertedLeads[i].id);
  }

  // ── 11. Appointments (scheduled + completed history) ──────────────────────
  type ApptStatus = "scheduled" | "completed";
  interface ApptRow {
    company_id: string;
    job_id: string;
    assigned_technician_id: string;
    scheduled_start: string;
    scheduled_end: string;
    status: ApptStatus;
    route_order: number;
    travel_time_minutes_from_previous: number | null;
  }
  const scheduledJobs = jobs.filter((j) => j.status === "scheduled");
  const apptRows: ApptRow[] = scheduledJobs.map((j, i) => ({
    company_id: companyId,
    job_id: j.id,
    assigned_technician_id: pick(techs, i).id,
    scheduled_start: hoursFromNow(i === 0 ? 2 : 26),
    scheduled_end: hoursFromNow(i === 0 ? 4 : 28),
    status: "scheduled",
    route_order: i + 1,
    travel_time_minutes_from_previous: i === 0 ? null : 18,
  }));
  // Completed jobs also get a (past) appointment record.
  const completedJobs = jobs.filter((j) => j.status === "completed" || j.status === "invoiced");
  completedJobs.forEach((j, i) => {
    apptRows.push({
      company_id: companyId,
      job_id: j.id,
      assigned_technician_id: pick(techs, i).id,
      scheduled_start: daysAgo(6 - i),
      scheduled_end: daysAgo(6 - i),
      status: "completed",
      route_order: i + 1,
      travel_time_minutes_from_previous: 15,
    });
  });
  if (apptRows.length) await db.from("appointments").insert(apptRows);
  console.log(`• ${apptRows.length} appointments`);

  // ── 12. Job checklist templates + per-job checklist items ─────────────────
  await db.from("job_checklist_templates").insert([
    { company_id: companyId, trade_category: "plumbing", description: "Isolate water supply before starting", sort_order: 1 },
    { company_id: companyId, trade_category: "plumbing", description: "Lay down dust sheets / protect the area", sort_order: 2 },
    { company_id: companyId, trade_category: "plumbing", description: "Pressure-test the system after the repair", sort_order: 3 },
    { company_id: companyId, trade_category: "plumbing", description: "Take before & after photos", sort_order: 4 },
    { company_id: companyId, trade_category: "plumbing", description: "Get customer sign-off", sort_order: 5 },
  ]);
  const checklistItemRows = jobs
    .filter((j) => j.status !== "unscheduled")
    .flatMap((j) => [
      { job_id: j.id, description: "Isolate water supply before starting", is_complete: true, sort_order: 1 },
      { job_id: j.id, description: "Pressure-test the system after the repair", is_complete: j.status === "completed" || j.status === "invoiced", sort_order: 2 },
      { job_id: j.id, description: "Get customer sign-off", is_complete: j.status === "invoiced", sort_order: 3 },
    ]);
  if (checklistItemRows.length) await db.from("job_checklist_items").insert(checklistItemRows);
  console.log(`• 5 checklist templates, ${checklistItemRows.length} checklist items`);

  // ── 13. Field reports + photos (completed jobs) ───────────────────────────
  const finishedForReports = jobs.filter((j) => j.status === "completed" || j.status === "invoiced");
  for (const j of finishedForReports) {
    await db.from("job_reports").insert({
      job_id: j.id,
      technician_id: pick(techs, 0).id,
      voice_transcript: "Replaced the valve, bled the rads, all working now.",
      ai_formatted_report:
        "Replaced the faulty isolation valve and bled the radiators. System pressure restored and tested; all functioning correctly.",
      materials_used: [{ name: "Isolation valve", quantity: 1, unit_cost: 18 }],
      signed_by_name: "Customer",
      signature_url: `${companyId}/demo/signature.png`,
    });
    await db.from("job_photos").insert([
      { job_id: j.id, uploaded_by: pick(techs, 0).id, photo_url: `${companyId}/demo/before.jpg`, photo_type: "before", caption: "Before" },
      { job_id: j.id, uploaded_by: pick(techs, 0).id, photo_url: `${companyId}/demo/after.jpg`, photo_type: "after", caption: "After" },
    ]);
  }
  console.log(`• ${finishedForReports.length} job reports + photos`);

  // ── 14. Invoices (6, mixed) — tied to finished jobs where possible ────────
  const invStatuses = ["paid", "paid", "sent", "overdue", "sent", "paid"] as const;
  const invoiceRows = invStatuses.map((status, i) => {
    const job = jobs[i] ?? null;
    const cust = job ? job.customer_id : pick(customers, i).id;
    const { line_items, subtotal, vat_amount, total } = priceLineItems([
      { description: "Labour", quantity: 2, unit_price: 65, kind: "labour" },
      { description: "Parts", quantity: 1, unit_price: 35 + i * 10, kind: "material" },
    ]);
    return {
      company_id: companyId,
      customer_id: cust,
      job_id: job?.id ?? null,
      invoice_number: `INV-2026-${String(i + 1).padStart(4, "0")}`,
      line_items,
      subtotal,
      vat_rate: VAT,
      vat_amount,
      total_inc_vat: total,
      status,
      due_date: status === "overdue" ? daysAgo(5).slice(0, 10) : daysFromNow(10).slice(0, 10),
      paid_at: status === "paid" ? daysAgo(i + 1) : null,
      platform_fee_amount: status === "paid" ? money(total * 0.01) : null,
      sent_at: daysAgo(i + 8),
      created_at: daysAgo(i + 10),
    };
  });
  await db.from("invoices").insert(invoiceRows);
  console.log(`• ${invoiceRows.length} invoices`);

  // ── 15. Job profitability snapshots (finished jobs) ───────────────────────
  const profitabilityRows = finishedForReports.map((j, i) => {
    const revenue = money(280 + i * 60);
    const labour_cost = money(90 + i * 20);
    const material_cost = money(35 + i * 12);
    const overhead_allocated = money(40);
    const profit = money(revenue - labour_cost - material_cost - overhead_allocated);
    return {
      company_id: companyId,
      job_id: j.id,
      technician_id: pick(techs, i).id,
      revenue,
      labour_cost,
      material_cost,
      overhead_allocated,
      profit,
      margin_pct: money((profit / revenue) * 100),
    };
  });
  if (profitabilityRows.length) await db.from("job_profitability").insert(profitabilityRows);
  console.log(`• ${profitabilityRows.length} profitability snapshots`);

  // ── 16. Materials (one below threshold) + a material request ──────────────
  const { data: materials, error: matErr } = await db
    .from("materials")
    .insert([
      { company_id: companyId, name: "15mm copper pipe (3m)", sku: "CU15", category: "Pipe & fittings", unit: "length", unit_cost: 12, quantity_on_hand: 24, reorder_threshold: 10, preferred_supplier_id: suppliers[1].id },
      { company_id: companyId, name: "Isolation valve", sku: "ISOV", category: "Valves", unit: "item", unit_cost: 18, quantity_on_hand: 4, reorder_threshold: 8, preferred_supplier_id: suppliers[0].id },
      { company_id: companyId, name: "Boiler PRV", sku: "PRV3", category: "Boiler spares", unit: "item", unit_cost: 22, quantity_on_hand: 12, reorder_threshold: 5, preferred_supplier_id: suppliers[0].id },
      { company_id: companyId, name: "PTFE tape", sku: "PTFE", category: "Consumables", unit: "roll", unit_cost: 1.2, quantity_on_hand: 40, reorder_threshold: 15, preferred_supplier_id: suppliers[0].id },
      { company_id: companyId, name: "Radiator bleed key", sku: "RBK", category: "Tools", unit: "item", unit_cost: 2.5, quantity_on_hand: 18, reorder_threshold: 6, preferred_supplier_id: suppliers[1].id },
    ])
    .select("id, name, reorder_threshold, quantity_on_hand, preferred_supplier_id");
  if (matErr || !materials) throw matErr ?? new Error("materials failed");

  // Re-order request for the item that's under its threshold.
  const lowStock = materials.find((m) => Number(m.quantity_on_hand) < Number(m.reorder_threshold));
  await db.from("material_requests").insert([
    {
      company_id: companyId,
      supplier_id: lowStock?.preferred_supplier_id ?? suppliers[0].id,
      material_id: lowStock?.id ?? materials[0].id,
      job_id: jobs[1]?.id ?? null,
      quantity_requested: 20,
      status: "sent",
      notes: "Running low — restock for next week's jobs.",
    },
    {
      company_id: companyId,
      supplier_id: suppliers[1].id,
      material_id: materials[0].id,
      job_id: null,
      quantity_requested: 10,
      status: "draft",
      notes: null,
    },
  ]);
  console.log(`• ${materials.length} materials, 2 material requests`);

  // ── 17. Renewal plans (one due within 14 days) ────────────────────────────
  await db.from("renewal_plans").insert([
    {
      company_id: companyId,
      customer_id: customers[0].id,
      property_id: propFor(customers[0].id),
      plan_type: "Annual boiler service",
      interval_months: 12,
      next_due_date: daysFromNow(10).slice(0, 10),
      last_completed_date: daysAgo(355).slice(0, 10),
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
  console.log("• 2 renewal plans");

  // ── 18. Review requests + polled Google reviews ───────────────────────────
  await db.from("review_requests").insert([
    { company_id: companyId, customer_id: customers[0].id, job_id: jobs[4]?.id ?? null, channel: "whatsapp", status: "sent", sent_at: daysAgo(3) },
    { company_id: companyId, customer_id: customers[2].id, job_id: jobs[5]?.id ?? null, channel: "sms", status: "sent", sent_at: daysAgo(2) },
    { company_id: companyId, customer_id: customers[5].id, job_id: null, channel: "email", status: "recovery", sent_at: daysAgo(1) },
  ]);
  await db.from("google_reviews").insert([
    { company_id: companyId, google_review_id: "places/demo/reviews/r1", author_name: "Margaret H.", rating: 5, review_text: "Fast, friendly and tidy — fixed our boiler same day. Highly recommend.", relative_time: "2 days ago", reviewed_at: daysAgo(2) },
    { company_id: companyId, google_review_id: "places/demo/reviews/r2", author_name: "James O.", rating: 4, review_text: "Good work, slightly late but kept me informed.", relative_time: "1 week ago", reviewed_at: daysAgo(7) },
    { company_id: companyId, google_review_id: "places/demo/reviews/r3", author_name: "Anonymous", rating: 2, review_text: "Took a while to get someone out.", relative_time: "2 weeks ago", reviewed_at: daysAgo(14) },
  ]);
  console.log("• 3 review requests, 3 Google reviews");

  // ── 19. Pricing nudges (Coach surface) ────────────────────────────────────
  await db.from("pricing_nudges").insert([
    {
      company_id: companyId,
      nudge_type: "rate_increase",
      message: "Your win rate is 71% — above target. Consider raising your hourly rate by £5.",
      action_label: "Review pricing",
      action_url: "/settings",
    },
    {
      company_id: companyId,
      nudge_type: "overdue_invoices",
      message: "You have 1 overdue invoice worth £204. Send a reminder?",
      action_label: "View invoices",
      action_url: "/invoices",
      dismissed_at: daysAgo(1),
    },
  ]);
  console.log("• 2 pricing nudges");

  // ── 20. Notifications (bell) ──────────────────────────────────────────────
  await db.from("notifications").insert([
    { company_id: companyId, user_id: null, type: "lead_received", title: "🔥 Hot lead", body: "Margaret Hughes: boiler not firing, no hot water.", link: "/leads", is_read: false, created_at: daysAgo(0) },
    { company_id: companyId, user_id: ownerUserId, type: "quote_accepted", title: "Quote accepted 🎉", body: "EST-2026-0001 was accepted — a job has been created.", link: "/estimates", is_read: false, created_at: daysAgo(1) },
    { company_id: companyId, user_id: null, type: "job_completed", title: "Job completed", body: "Pat Pipes completed a job — ready to invoice.", link: "/jobs", is_read: true, created_at: daysAgo(2) },
    { company_id: companyId, user_id: null, type: "google_review_low_rating", title: "New low-rated Google review", body: "Anonymous left a 2★ review — consider reaching out.", link: "/reviews", is_read: false, created_at: daysAgo(2) },
  ]);
  console.log("• 4 notifications");

  // ── 21. AI Coach conversation + messages ──────────────────────────────────
  const { data: convo } = await db
    .from("ai_coach_conversations")
    .insert({
      company_id: companyId,
      user_id: ownerUserId,
      title: "Why did profit dip last month?",
    })
    .select("id")
    .single();
  if (convo) {
    await db.from("ai_coach_messages").insert([
      { conversation_id: convo.id, role: "user", content: "Why did our profit dip last month?", data_used: null },
      {
        conversation_id: convo.id,
        role: "assistant",
        content:
          "Profit fell ~12% mainly because material costs rose on three boiler jobs and one invoice (£204) is overdue. Your labour utilisation held steady. Chasing the overdue invoice and reviewing supplier pricing would recover most of it.",
        data_used: [
          { tool: "get_finance_summary", args: { period: "last_month" } },
          { tool: "get_overdue_invoices", args: {} },
        ],
      },
    ]);
  }
  console.log("• 1 coach conversation (2 messages)");

  // ── 22. Background job queue (worker examples) ────────────────────────────
  await db.from("jobs_queue").insert([
    { task_type: "send_review_request", payload: { job_id: jobs[6]?.id ?? null }, status: "completed", attempts: 1, processed_at: daysAgo(1) },
    { task_type: "generate_invoice_pdf", payload: { invoice_number: "INV-2026-0001" }, status: "completed", attempts: 1, processed_at: daysAgo(2) },
    { task_type: "poll_google_reviews", payload: { company_id: companyId }, status: "pending", attempts: 0 },
  ]);
  console.log("• 3 background queue tasks");

  console.log("\n✓ Seed complete — every table populated.");
  console.log("┌──────────────────────────────────────────────┐");
  console.log(`│  LOGIN  ${DEMO_EMAIL}  /  ${DEMO_PASSWORD}        │`);
  console.log("│  Role: owner (full access) · /login            │");
  console.log("└──────────────────────────────────────────────┘");
}

main().catch((e) => {
  console.error("✗ Seed failed:", e);
  process.exit(1);
});

// Avoid an unused-import error if the typed client narrows differently.
export type _Seed = SupabaseClient<Database>;
