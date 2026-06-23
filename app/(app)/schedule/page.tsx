import Link from "next/link";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { canWrite } from "@/lib/auth/roles";
import { formatTime } from "@/lib/format";
import { PageHeader } from "@/components/shared/PageHeader";
import { ScheduleDayNav } from "@/components/schedule/ScheduleDayNav";
import { ScheduleJobDialog } from "@/components/schedule/ScheduleJobDialog";
import { ScheduleRealtime } from "@/components/schedule/ScheduleRealtime";
import { OptimizeRouteButton } from "@/components/schedule/OptimizeRouteButton";
import { EmergencyFitButton } from "@/components/schedule/EmergencyFitButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Schedule" };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface ApptView {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  assigned_technician_id: string | null;
  route_order: number | null;
  travel_minutes: number | null;
  job: { id: string; title: string; trade_category: string } | null;
  customer: { name: string } | null;
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const ctx = await requireSection("schedule");
  const supabase = createClient();
  const region = ctx.company.region;
  const writable = canWrite(ctx.role);
  const t = await getTranslations("schedule");

  const date =
    searchParams.date && DATE_RE.test(searchParams.date)
      ? searchParams.date
      : new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59.999Z`).toISOString();

  const [{ data: technicians }, { data: rawAppts }, { data: unscheduled }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("id, name")
        .eq("company_id", ctx.company.id)
        .eq("role", "technician")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("appointments")
        .select(
          "id, scheduled_start, scheduled_end, status, assigned_technician_id, route_order, travel_time_minutes_from_previous, jobs(id, title, trade_category, customers(name))"
        )
        .eq("company_id", ctx.company.id)
        .gte("scheduled_start", dayStart)
        .lte("scheduled_start", dayEnd)
        .neq("status", "cancelled")
        .order("scheduled_start"),
      supabase
        .from("jobs")
        .select("id, title, trade_category, estimated_duration_minutes, priority")
        .eq("company_id", ctx.company.id)
        .eq("status", "unscheduled")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const appts: ApptView[] = (rawAppts ?? []).map((a) => {
    const job = a.jobs as unknown as
      | { id: string; title: string; trade_category: string; customers: { name: string } | null }
      | null;
    return {
      id: a.id,
      scheduled_start: a.scheduled_start,
      scheduled_end: a.scheduled_end,
      status: a.status,
      assigned_technician_id: a.assigned_technician_id,
      route_order: a.route_order,
      travel_minutes: a.travel_time_minutes_from_previous,
      job: job ? { id: job.id, title: job.title, trade_category: job.trade_category } : null,
      customer: job?.customers ?? null,
    };
  });

  const techs = technicians ?? [];
  // One lane per technician, plus an "Unassigned" lane for unrouted work.
  const lanes = [
    ...techs.map((t) => ({ id: t.id, name: t.name })),
    { id: "__unassigned__", name: "Unassigned" },
  ];
  const byLane = new Map<string, ApptView[]>();
  for (const a of appts) {
    const key = a.assigned_technician_id ?? "__unassigned__";
    const arr = byLane.get(key) ?? [];
    arr.push(a);
    byLane.set(key, arr);
  }

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <div className="flex items-center gap-3">
            <ScheduleRealtime companyId={ctx.company.id} />
            <ScheduleDayNav date={date} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          {lanes.map((lane) => {
            const laneAppts = (byLane.get(lane.id) ?? []).slice().sort((a, b) => {
              // Optimised route order takes precedence over start time when set.
              if (a.route_order != null && b.route_order != null) return a.route_order - b.route_order;
              if (a.route_order != null) return -1;
              if (b.route_order != null) return 1;
              return a.scheduled_start.localeCompare(b.scheduled_start);
            });
            const isTech = lane.id !== "__unassigned__";
            return (
              <Card key={lane.id}>
                <CardHeader className="py-3">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {lane.name}
                      <span className="text-muted-foreground">({laneAppts.length})</span>
                    </span>
                    {writable && isTech && laneAppts.length >= 3 && (
                      <OptimizeRouteButton technicianId={lane.id} date={date} />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {laneAppts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("noJobs")}</p>
                  ) : (
                    <div className="flex flex-wrap items-stretch gap-2">
                      {laneAppts.map((a, idx) => (
                        <div key={a.id} className="flex items-center gap-2">
                          {idx > 0 && a.travel_minutes != null && (
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              🚗 {a.travel_minutes}m
                            </span>
                          )}
                          <Link
                            href={a.job ? `/jobs/${a.job.id}` : "#"}
                            className="group rounded-md border bg-card p-3 text-sm transition-colors hover:bg-muted/50"
                          >
                            <p className="flex items-center gap-1.5 font-medium">
                              {a.route_order != null && (
                                <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                  {a.route_order}
                                </span>
                              )}
                              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                              {formatTime(a.scheduled_start, region)}–{formatTime(a.scheduled_end, region)}
                            </p>
                            <p className="mt-1 max-w-[200px] truncate">{a.job?.title ?? "Job"}</p>
                            {a.customer && (
                              <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                                {a.customer.name}
                              </p>
                            )}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                {t("unscheduled")} ({unscheduled?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!unscheduled || unscheduled.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("nothingWaiting")}</p>
              ) : (
                unscheduled.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-md border p-3 text-sm"
                  >
                    <Link
                      href={`/jobs/${job.id}`}
                      className="block truncate font-medium hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <Badge variant="secondary" className="capitalize">
                        {job.trade_category}
                      </Badge>
                      {job.priority === "emergency" && (
                        <Badge variant="destructive">Emergency</Badge>
                      )}
                    </p>
                    {writable && (
                      <div className="flex flex-wrap gap-2">
                        <ScheduleJobDialog
                          jobId={job.id}
                          jobTitle={job.title}
                          technicians={techs}
                          defaultDate={date}
                          defaultDurationMinutes={job.estimated_duration_minutes ?? 60}
                        />
                        {job.priority === "emergency" && (
                          <EmergencyFitButton jobId={job.id} />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
