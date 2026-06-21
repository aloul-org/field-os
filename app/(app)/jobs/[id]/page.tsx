import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, FileText, CalendarClock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobStatusControl } from "@/components/jobs/JobStatusControl";
import { AppointmentForm } from "@/components/jobs/AppointmentForm";
import { JobInvoiceButton } from "@/components/jobs/JobInvoiceButton";
import type { JobStatus } from "@/lib/types/database";

const STATUS_VARIANT: Record<JobStatus, "secondary" | "default" | "success" | "warning" | "destructive"> = {
  unscheduled: "warning",
  scheduled: "default",
  en_route: "default",
  in_progress: "default",
  completed: "success",
  invoiced: "secondary",
  cancelled: "destructive",
};

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireSection("jobs");
  const supabase = createClient();
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);

  const { data: job } = await supabase
    .from("jobs")
    .select("*, customers(id, name), properties(address_line1, city, postcode), estimates(id, estimate_number, total_inc_vat)")
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();

  if (!job) notFound();

  const customer = job.customers as unknown as { id: string; name: string } | null;
  const property = job.properties as unknown as { address_line1: string; city: string | null; postcode: string | null } | null;
  const estimate = job.estimates as unknown as { id: string; estimate_number: string; total_inc_vat: number } | null;

  const [{ data: appointments }, { data: technicians }, { data: invoice }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, scheduled_start, scheduled_end, status, team_members(name)")
        .eq("job_id", job.id)
        .order("scheduled_start", { ascending: true }),
      supabase
        .from("team_members")
        .select("id, name")
        .eq("company_id", ctx.company.id)
        .eq("role", "technician")
        .eq("is_active", true),
      supabase
        .from("invoices")
        .select("id")
        .eq("job_id", job.id)
        .maybeSingle(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
            <Badge variant={STATUS_VARIANT[job.status]} className="capitalize">
              {job.status.replace("_", " ")}
            </Badge>
            {job.priority === "emergency" && (
              <Badge variant="destructive">Emergency</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.job_number}
            {customer && (
              <>
                {" · "}
                <Link href={`/customers/${customer.id}`} className="hover:text-foreground">
                  {customer.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {job.description && (
                <p className="text-muted-foreground">{job.description}</p>
              )}
              {property && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {[property.address_line1, property.city, property.postcode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointments && appointments.length > 0 ? (
                <ul className="space-y-2">
                  {appointments.map((a) => {
                    const tech = a.team_members as unknown as { name: string } | null;
                    return (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                      >
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDateTime(a.scheduled_start, region)}</span>
                        {tech && (
                          <span className="ml-auto text-muted-foreground">
                            {tech.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not scheduled yet.
                </p>
              )}
              {writable && job.status !== "cancelled" && (
                <div className="border-t pt-4">
                  <AppointmentForm
                    jobId={job.id}
                    technicians={technicians ?? []}
                    defaultDurationMinutes={job.estimated_duration_minutes ?? 60}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatusControl
                jobId={job.id}
                status={job.status}
                disabled={!writable}
              />
            </CardContent>
          </Card>

          {estimate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Linked estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/estimates/${estimate.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {estimate.estimate_number}
                  </span>
                  <span className="font-medium">
                    {formatCurrency(Number(estimate.total_inc_vat), region)}
                  </span>
                </Link>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <JobInvoiceButton
                jobId={job.id}
                status={job.status}
                invoiceId={invoice?.id ?? null}
                canWrite={writable}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
