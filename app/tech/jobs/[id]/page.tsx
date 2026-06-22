import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireTechnician } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TechChecklist } from "@/components/tech/TechChecklist";
import { TechPhotoUpload } from "@/components/tech/TechPhotoUpload";
import { VoiceReportRecorder } from "@/components/tech/VoiceReportRecorder";
import { SignatureComplete } from "@/components/tech/SignatureComplete";

export const metadata = { title: "Job" };

export default async function TechJobPage({
  params,
}: {
  params: { id: string };
}) {
  const ctx = await requireTechnician();
  const supabase = createClient();

  // Must be assigned to this technician.
  const { data: appt } = await supabase
    .from("appointments")
    .select("id")
    .eq("job_id", params.id)
    .eq("assigned_technician_id", ctx.member.id)
    .limit(1)
    .maybeSingle();
  if (!appt) notFound();

  const { data: job } = await supabase
    .from("jobs")
    .select(
      "id, title, description, status, customers(name, phone), properties(address_line1, city, postcode, access_notes)"
    )
    .eq("id", params.id)
    .eq("company_id", ctx.company.id)
    .maybeSingle();
  if (!job) notFound();

  const customer = job.customers as unknown as { name: string; phone: string | null } | null;
  const property = job.properties as unknown as
    | { address_line1: string; city: string | null; postcode: string | null; access_notes: string | null }
    | null;
  const address = property
    ? [property.address_line1, property.city, property.postcode].filter(Boolean).join(", ")
    : null;

  const [{ data: checklist }, { data: photos }, { data: report }] = await Promise.all([
    supabase
      .from("job_checklist_items")
      .select("id, description, is_complete")
      .eq("job_id", job.id)
      .order("sort_order"),
    supabase
      .from("job_photos")
      .select("id, photo_url, photo_type")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("job_reports")
      .select("ai_formatted_report, voice_transcript")
      .eq("job_id", job.id)
      .maybeSingle(),
  ]);

  // Sign private photo URLs for display.
  const photoCards = await Promise.all(
    (photos ?? []).map(async (p) => {
      // photo_url stores the storage path "{company_id}/...".
      const { data } = await supabase.storage
        .from("job-photos")
        .createSignedUrl(p.photo_url, 60 * 60);
      return { id: p.id, type: p.photo_type, url: data?.signedUrl ?? null };
    })
  );

  return (
    <div className="space-y-5">
      <Link
        href="/tech/today"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Today
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl font-bold tracking-tight">{job.title}</h1>
          <Badge variant="secondary" className="capitalize">
            {job.status.replace("_", " ")}
          </Badge>
        </div>
        {customer && <p className="mt-1 text-base">{customer.name}</p>}
      </header>

      {(address || property?.access_notes) && (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm">
            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary"
              >
                <MapPin className="h-4 w-4" /> {address}
              </a>
            )}
            {customer?.phone && (
              <a href={`tel:${customer.phone}`} className="block text-primary">
                {customer.phone}
              </a>
            )}
            {property?.access_notes && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0" /> {property.access_notes}
              </p>
            )}
            {job.description && <p className="text-muted-foreground">{job.description}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <TechChecklist items={checklist ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Photos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {photoCards.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photoCards.map((p) =>
                p.url ? (
                  <div key={p.id} className="relative aspect-square overflow-hidden rounded-md">
                    <Image
                      src={p.url}
                      alt={p.type}
                      fill
                      sizes="33vw"
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] capitalize text-white">
                      {p.type}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          )}
          <TechPhotoUpload jobId={job.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Job report</CardTitle>
        </CardHeader>
        <CardContent>
          <VoiceReportRecorder
            jobId={job.id}
            existingReport={report?.ai_formatted_report ?? null}
          />
        </CardContent>
      </Card>

      {job.status !== "completed" && job.status !== "invoiced" && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-base">Customer sign-off</CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureComplete jobId={job.id} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
