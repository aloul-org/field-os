import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/** Standard typed success envelope. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

/** Standard typed error envelope. */
export function err(
  message: string,
  status = 400,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, details },
    { status }
  );
}

export const unauthorized = () => err("Not authenticated", 401);
export const forbidden = (msg = "You don't have access to this") =>
  err(msg, 403);
export const notFound = (msg = "Not found") => err(msg, 404);

/**
 * Parse + validate a JSON body against a Zod schema. Returns either the typed
 * data or a 400 NextResponse describing the validation failure — every API
 * route should run input through this before touching the database.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { data: null, error: err("Invalid JSON body", 400) };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      data: null,
      error: err("Validation failed", 422, flattenZodError(result.error)),
    };
  }
  return { data: result.data, error: null };
}

export function flattenZodError(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
