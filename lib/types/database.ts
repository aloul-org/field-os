/**
 * Hand-maintained Supabase schema types.
 *
 * Mirrors supabase/migrations exactly. When the schema changes, update this file
 * (or regenerate with `supabase gen types typescript`). Every Supabase client in
 * the app is parameterised with this `Database` type so queries are fully typed.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Shared domain enums ────────────────────────────────────────────────────
export type Trade =
  | "plumbing"
  | "electrical"
  | "hvac"
  | "roofing"
  | "landscaping"
  | "cleaning"
  | "pest_control"
  | "appliance_repair"
  | "pool_services"
  | "general_contracting"
  | "other";

export type Region = "UK" | "DE";
export type AppLanguage = "en" | "de";
export type TeamRole =
  | "owner"
  | "admin"
  | "dispatcher"
  | "estimator"
  | "technician"
  | "viewer";
export type SubscriptionPlan = "starter" | "growth" | "pro" | "enterprise";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete";
export type LeadSource =
  | "phone_call"
  | "whatsapp"
  | "sms"
  | "website_widget"
  | "facebook"
  | "instagram"
  | "manual"
  | "email";
export type LeadScore = "hot" | "warm" | "cold";
export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "converted"
  | "lost"
  | "spam";
export type Urgency = "emergency" | "urgent" | "normal" | "flexible";
export type JobStatus =
  | "unscheduled"
  | "scheduled"
  | "en_route"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "cancelled";
export type JobPriority = "emergency" | "urgent" | "normal" | "flexible";
export type AppointmentStatus =
  | "scheduled"
  | "en_route"
  | "on_site"
  | "completed"
  | "cancelled"
  | "rescheduled";
export type EstimateStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type AiConfidence = "high" | "medium" | "low";
export type Channel = "whatsapp" | "sms" | "email";

/** A single quote/invoice line item. Money is always recomputed server-side. */
export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  /** quantity * unit_price, recomputed in code — never trusted from the LLM. */
  line_total: number;
  kind?: "labour" | "material" | "call_out" | "other";
}

/** Helper to build typed table definitions with sensible Insert/Update shapes. */
interface TableShape<Row, Insert, Update> {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

// ── Row interfaces ─────────────────────────────────────────────────────────
export type CompanyRow = {
  id: string;
  business_name: string;
  owner_user_id: string;
  trade: Trade;
  email: string;
  phone: string | null;
  address: string | null;
  region: Region;
  timezone: string;
  logo_url: string | null;
  accent_colour: string | null;
  default_hourly_rate: number | null;
  default_call_out_fee: number | null;
  vat_registered: boolean;
  vat_number: string | null;
  vat_rate: number;
  payment_terms_days: number | null;
  language: AppLanguage;
  business_hours: Json;
  company_size: string | null;
  monthly_overhead: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_connect_account_id: string | null;
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  google_business_profile_url: string | null;
  google_place_id: string | null;
  twilio_voice_number: string | null;
  voice_receptionist_enabled: boolean;
  voice_greeting: string | null;
  widget_public_key: string;
  widget_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type TeamMemberRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  name: string;
  email: string;
  role: TeamRole;
  hourly_rate: number | null;
  skills: string[];
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  invite_token: string;
  invite_accepted_at: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_location_at: string | null;
  created_at: string;
}

export type CustomerRow = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  customer_type: "residential" | "commercial";
  lifetime_value: number;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export type PropertyRow = {
  id: string;
  company_id: string;
  customer_id: string;
  label: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  access_notes: string | null;
  property_value_estimate: number | null;
  created_at: string;
}

export type LeadRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  source: LeadSource;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  raw_message: string | null;
  job_description: string | null;
  address: string | null;
  score: LeadScore | null;
  score_reason: string | null;
  status: LeadStatus;
  assigned_to: string | null;
  converted_to_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CallRow = {
  id: string;
  company_id: string;
  lead_id: string | null;
  twilio_call_sid: string;
  caller_number: string;
  direction: "inbound" | "outbound";
  status:
    | "in_progress"
    | "completed"
    | "voicemail"
    | "missed"
    | "forwarded_to_human"
    | "failed";
  duration_seconds: number | null;
  recording_url: string | null;
  transcript: string | null;
  ai_summary: string | null;
  urgency: Urgency | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export type JobRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  property_id: string | null;
  lead_id: string | null;
  estimate_id: string | null;
  job_number: string;
  title: string;
  trade_category: string;
  description: string | null;
  status: JobStatus;
  priority: JobPriority;
  estimated_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export type AppointmentRow = {
  id: string;
  company_id: string;
  job_id: string;
  assigned_technician_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: AppointmentStatus;
  route_order: number | null;
  travel_time_minutes_from_previous: number | null;
  created_at: string;
}

export type JobPhotoRow = {
  id: string;
  job_id: string;
  uploaded_by: string | null;
  photo_url: string;
  caption: string | null;
  photo_type: "before" | "progress" | "after" | "issue";
  created_at: string;
}

export type JobChecklistItemRow = {
  id: string;
  job_id: string;
  description: string;
  is_complete: boolean;
  sort_order: number;
}

export type JobReportRow = {
  id: string;
  job_id: string;
  technician_id: string | null;
  voice_transcript: string | null;
  ai_formatted_report: string | null;
  materials_used: Json;
  signature_url: string | null;
  signed_by_name: string | null;
  created_at: string;
}

export type EstimateRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  property_id: string | null;
  lead_id: string | null;
  job_id: string | null;
  estimate_number: string;
  job_title: string;
  trade_category: string;
  job_description_raw: string | null;
  summary_for_customer: string;
  line_items: LineItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_inc_vat: number;
  estimated_duration_hours: number | null;
  ai_confidence: AiConfidence | null;
  ai_flags: Json;
  win_probability: number | null;
  win_probability_factors: Json;
  photo_urls: Json;
  status: EstimateStatus;
  pdf_url: string | null;
  acceptance_token: string;
  sent_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  expires_at: string | null;
  follow_up_1_sent_at: string | null;
  follow_up_2_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type MaterialRow = {
  id: string;
  company_id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string | null;
  unit_cost: number | null;
  quantity_on_hand: number;
  reorder_threshold: number;
  preferred_supplier_id: string | null;
  created_at: string;
  updated_at: string;
}

export type SupplierRow = {
  id: string;
  company_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

export type MaterialRequestRow = {
  id: string;
  company_id: string;
  supplier_id: string | null;
  material_id: string | null;
  job_id: string | null;
  quantity_requested: number;
  status: "draft" | "sent" | "confirmed" | "received" | "cancelled";
  notes: string | null;
  created_at: string;
}

export type InvoiceRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  job_id: string | null;
  estimate_id: string | null;
  invoice_number: string;
  line_items: LineItem[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_inc_vat: number;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  pdf_url: string | null;
  stripe_payment_link: string | null;
  stripe_payment_intent_id: string | null;
  platform_fee_amount: number | null;
  public_token: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export type JobProfitabilityRow = {
  id: string;
  company_id: string;
  job_id: string;
  technician_id: string | null;
  revenue: number;
  labour_cost: number;
  material_cost: number;
  overhead_allocated: number;
  profit: number | null;
  margin_pct: number | null;
  created_at: string;
}

export type AiCoachConversationRow = {
  id: string;
  company_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export type AiCoachMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  data_used: Json | null;
  created_at: string;
}

export type FollowUpLogRow = {
  id: string;
  estimate_id: string;
  channel: Channel;
  message_body: string;
  sent_at: string;
}

export type RenewalPlanRow = {
  id: string;
  company_id: string;
  customer_id: string;
  property_id: string | null;
  plan_type: string;
  interval_months: number;
  next_due_date: string;
  last_completed_date: string | null;
  status: "active" | "paused" | "cancelled";
  created_at: string;
}

export type ReviewRequestRow = {
  id: string;
  company_id: string;
  customer_id: string | null;
  job_id: string | null;
  channel: Channel;
  sent_at: string;
  status: string;
}

export type GoogleReviewRow = {
  id: string;
  company_id: string;
  google_review_id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string | null;
  relative_time: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export type PricingNudgeRow = {
  id: string;
  company_id: string;
  nudge_type: string;
  message: string;
  action_label: string | null;
  action_url: string | null;
  dismissed_at: string | null;
  created_at: string;
}

export type NotificationRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type JobsQueueRow = {
  id: string;
  task_type: string;
  payload: Json;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  error: string | null;
  created_at: string;
  processed_at: string | null;
}

export type JobChecklistTemplateRow = {
  id: string;
  company_id: string;
  trade_category: string;
  description: string;
  sort_order: number;
  created_at: string;
}

// ── Database type ──────────────────────────────────────────────────────────
// Insert/Update are modelled as Partial<Row>: most columns carry DB defaults
// (gen_random_uuid, now(), region/vat defaults, status enums, jsonb defaults),
// so requiring them at compile time would be wrong. Excess-property checking
// against Row still catches typos; the real "required field" enforcement lives
// in the Zod schemas every write goes through (lib/validations/*).
type InsertOf<Row> = Partial<Row>;
type UpdateOf<Row> = Partial<Row>;

export interface Database {
  public: {
    Tables: {
      companies: TableShape<CompanyRow, InsertOf<CompanyRow>, UpdateOf<CompanyRow>>;
      team_members: TableShape<
        TeamMemberRow,
        InsertOf<TeamMemberRow>,
        UpdateOf<TeamMemberRow>
      >;
      customers: TableShape<
        CustomerRow,
        InsertOf<CustomerRow>,
        UpdateOf<CustomerRow>
      >;
      properties: TableShape<
        PropertyRow,
        InsertOf<PropertyRow>,
        UpdateOf<PropertyRow>
      >;
      leads: TableShape<LeadRow, InsertOf<LeadRow>, UpdateOf<LeadRow>>;
      calls: TableShape<CallRow, InsertOf<CallRow>, UpdateOf<CallRow>>;
      jobs: TableShape<JobRow, InsertOf<JobRow>, UpdateOf<JobRow>>;
      appointments: TableShape<
        AppointmentRow,
        InsertOf<AppointmentRow>,
        UpdateOf<AppointmentRow>
      >;
      job_photos: TableShape<
        JobPhotoRow,
        InsertOf<JobPhotoRow>,
        UpdateOf<JobPhotoRow>
      >;
      job_checklist_items: TableShape<
        JobChecklistItemRow,
        InsertOf<JobChecklistItemRow>,
        UpdateOf<JobChecklistItemRow>
      >;
      job_checklist_templates: TableShape<
        JobChecklistTemplateRow,
        InsertOf<JobChecklistTemplateRow>,
        UpdateOf<JobChecklistTemplateRow>
      >;
      job_reports: TableShape<
        JobReportRow,
        InsertOf<JobReportRow>,
        UpdateOf<JobReportRow>
      >;
      estimates: TableShape<
        EstimateRow,
        InsertOf<EstimateRow>,
        UpdateOf<EstimateRow>
      >;
      materials: TableShape<
        MaterialRow,
        InsertOf<MaterialRow>,
        UpdateOf<MaterialRow>
      >;
      suppliers: TableShape<
        SupplierRow,
        InsertOf<SupplierRow>,
        UpdateOf<SupplierRow>
      >;
      material_requests: TableShape<
        MaterialRequestRow,
        InsertOf<MaterialRequestRow>,
        UpdateOf<MaterialRequestRow>
      >;
      invoices: TableShape<
        InvoiceRow,
        InsertOf<InvoiceRow>,
        UpdateOf<InvoiceRow>
      >;
      job_profitability: TableShape<
        JobProfitabilityRow,
        InsertOf<JobProfitabilityRow>,
        UpdateOf<JobProfitabilityRow>
      >;
      ai_coach_conversations: TableShape<
        AiCoachConversationRow,
        InsertOf<AiCoachConversationRow>,
        UpdateOf<AiCoachConversationRow>
      >;
      ai_coach_messages: TableShape<
        AiCoachMessageRow,
        InsertOf<AiCoachMessageRow>,
        UpdateOf<AiCoachMessageRow>
      >;
      follow_up_log: TableShape<
        FollowUpLogRow,
        InsertOf<FollowUpLogRow>,
        UpdateOf<FollowUpLogRow>
      >;
      renewal_plans: TableShape<
        RenewalPlanRow,
        InsertOf<RenewalPlanRow>,
        UpdateOf<RenewalPlanRow>
      >;
      review_requests: TableShape<
        ReviewRequestRow,
        InsertOf<ReviewRequestRow>,
        UpdateOf<ReviewRequestRow>
      >;
      google_reviews: TableShape<
        GoogleReviewRow,
        InsertOf<GoogleReviewRow>,
        UpdateOf<GoogleReviewRow>
      >;
      pricing_nudges: TableShape<
        PricingNudgeRow,
        InsertOf<PricingNudgeRow>,
        UpdateOf<PricingNudgeRow>
      >;
      notifications: TableShape<
        NotificationRow,
        InsertOf<NotificationRow>,
        UpdateOf<NotificationRow>
      >;
      jobs_queue: TableShape<
        JobsQueueRow,
        InsertOf<JobsQueueRow>,
        UpdateOf<JobsQueueRow>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      get_user_company_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
      get_user_role: {
        Args: { p_company_id: string };
        Returns: string;
      };
      get_public_estimate: {
        Args: { p_token: string };
        Returns: Json;
      };
      get_public_invoice: {
        Args: { p_token: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
