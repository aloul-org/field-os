import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

/**
 * Upload a generated PDF to the public `pdfs` bucket under the company's folder
 * and return its public URL. Path convention: {companyId}/{folder}/{filename}.
 */
export async function uploadPdf(
  supabase: SupabaseClient<Database>,
  companyId: string,
  folder: string,
  filename: string,
  buffer: Buffer
): Promise<string | null> {
  const path = `${companyId}/${folder}/${filename}`;
  const { error } = await supabase.storage.from("pdfs").upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) return null;
  const { data } = supabase.storage.from("pdfs").getPublicUrl(path);
  return data.publicUrl;
}
