import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireTechnician } from "@/lib/auth/session";
import { formatTime } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechStatusButton } from "@/components/tech/TechStatusButton";
import { LocationSharing } from "@/components/tech/LocationSharing";
import type { JobStatus } from "@/lib/types/database";

export const metadata = { title: "Today" };

interface TodayJob {
  apptId: string;
  start: string;
  end: string;
  jobId: string;
  title: string;
  status: JobStatus;
  customerName: string | null;
  address: string | null;
}

export default async function TechTodayPage() {
  const ctx = await requireTechnician();
  const supabase = createClient();
  const region = ctx.company.region;

  const today = new Date().toISOString().slice(0, 10);
  const dayStart = new Date(`${today}T00:00:00.000Z`).toISOString();
  const dayEnd = new Date(`${today}T23:59:59.999Z`).toISOString();

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, scheduled_start, scheduled_end, jobs(id, title, status, customers(name), properties(address_line1, city, postcode))"
    )
    .eq("company_id", ctx.company.id)
    .eq("assigned_technician_id", ctx.member.id)
    .gte("scheduled_start", dayStart)
    .lte("scheduled_start", dayEnd)
    .neq("status", "cancelled")
    .order("scheduled_start");

  const jobs: TodayJob[] = (appts ?? []).map((a) => {
    const job = a.jobs as unknown as
      | {
          id: string;
          title: string;
          status: JobStatus;
          customers: { name: string } | null;
          properties: { address_line1: string; city: string | null; postcode: string | null } | null;
        }
      | null;
    const prop = job?.properties ?? null;
    return {
      apptId: a.id,
      start: a.scheduled_start,
      end: a.scheduled_end,
      jobId: job?.id ?? "",
      title: job?.title ?? "Job",
      status: job?.status ?? "scheduled",
      customerName: job?.customers?.name ?? null,
      address: prop
        ? [prop.address_line1, prop.city, prop.postcode].filter(Boolean).join(", ")
        : null,
    };
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Today&apos;s jobs
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </header>

      <LocationSharing />

      {jobs.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Nothing scheduled for today</p>
          <p className="text-sm text-muted-foreground">
            When the office books you a job, it&apos;ll show up here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
            <Card key={j.apptId} className="overflow-hidden">
              <Link href={`/tech/jobs/${j.jobId}`} className="block p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatTime(j.start, region)}–{formatTime(j.end, region)}
                  </p>
                  <Badge variant="secondary" className="capitalize">
                    {j.status.replace("_", " ")}
                  </Badge>
                </div>
                <h2 className="mt-2 text-lg font-semibold">{j.title}</h2>
                {j.customerName && <p className="text-sm">{j.customerName}</p>}
                {j.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(j.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary"
                  >
                    <MapPin className="h-4 w-4" />
                    {j.address}
                  </a>
                )}
              </Link>
              <div className="px-4 pb-4">
                <TechStatusButton jobId={j.jobId} status={j.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
