import { randomUUID } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { getRouteContext } from "@/lib/auth/session";
import { ok, err, unauthorized, forbidden } from "@/lib/api/response";

export const runtime = "nodejs";

const PHOTO_TYPES = new Set(["before", "progress", "after", "issue"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Technician photo upload → private job-photos bucket + job_photos row. */
export async function POST(request: Request) {
  const auth = await getRouteContext();
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const ctx = auth.ctx;
  if (ctx.role !== "technician") return forbidden();

  const form = await request.formData();
  const jobId = String(form.get("jobId") ?? "");
  const photoType = String(form.get("photoType") ?? "progress");
  const file = form.get("file");

  if (!jobId || !(file instanceof Blob)) return err("Missing photo.", 400);
  if (!PHOTO_TYPES.has(photoType)) return err("Invalid photo type.", 400);
  if (file.size > MAX_BYTES) return err("Photo is too large (max 10 MB).", 413);
  const ext = EXT[file.type];
  if (!ext) return err("Unsupported image type.", 415);

  const supabase = createClient();

  // Confirm the job is the technician's.
  const { data: appt } = await supabase
    .from("appointments")
    .select("id")
    .eq("job_id", jobId)
    .eq("assigned_technician_id", ctx.member.id)
    .limit(1)
    .maybeSingle();
  if (!appt) return forbidden("This job isn't assigned to you.");

  const path = `${ctx.company.id}/${jobId}/${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from("job-photos")
    .upload(path, bytes, { contentType: file.type });
  if (uploadError) return err("Couldn't upload the photo.", 500);

  const { error: insertError } = await supabase.from("job_photos").insert({
    job_id: jobId,
    uploaded_by: ctx.member.id,
    photo_url: path,
    photo_type: photoType as "before" | "progress" | "after" | "issue",
  });
  if (insertError) return err("Couldn't save the photo.", 500);

  return ok({ uploaded: true });
}
