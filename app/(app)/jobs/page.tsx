import { Briefcase } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireSection } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { JobTicketCard } from "@/components/shared/JobTicketCard";
import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/lib/types/database";

export const metadata = { title: "Jobs" };

const COLUMNS: { key: JobStatus; label: string; match: JobStatus[] }[] = [
  { key: "unscheduled", label: "Unscheduled", match: ["unscheduled"] },
  { key: "scheduled", label: "Scheduled", match: ["scheduled"] },
  { key: "in_progress", label: "In progress", match: ["en_route", "in_progress"] },
  { key: "completed", label: "Completed", match: ["completed"] },
  { key: "invoiced", label: "Invoiced", match: ["invoiced"] },
];

interface JobCardData {
  id: string;
  job_number: string;
  title: string;
  status: JobStatus;
  priority: string;
  customers: { name: string } | null;
}

export default async function JobsPage() {
  const ctx = await requireSection("jobs");
  const supabase = createClient();

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, job_number, title, status, priority, customers(name)")
    .eq("company_id", ctx.company.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })
    .limit(200);

  const list = (jobs ?? []) as unknown as JobCardData[];

  return (
    <div>
      <PageHeader title="Jobs" />

      {list.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Jobs are created automatically when a customer accepts a quote."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const cards = list.filter((j) => col.match.includes(j.status));
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cards.map((j) => (
                    <JobTicketCard key={j.id} href={`/jobs/${j.id}`} className="p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium leading-tight">{j.title}</p>
                        {j.priority === "emergency" && (
                          <Badge variant="destructive" className="shrink-0">
                            !
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{j.job_number}</span>
                        {j.customers ? ` · ${j.customers.name}` : ""}
                      </p>
                    </JobTicketCard>
                  ))}
                  {cards.length === 0 && (
                    <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                      Nothing here
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
