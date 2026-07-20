import { getRouteContext } from "@/lib/auth/session";
import { ok, err, forbidden, unauthorized, parseBody } from "@/lib/api/response";
import {
  inviteMemberCore,
  updateMemberRoleCore,
  setMemberActiveCore,
} from "@/lib/team/manage-team";
import { inviteMemberSchema, assignableRoleSchema } from "@/lib/validations/team";
import { z } from "zod";

export const runtime = "nodejs";

/** Mobile counterpart of the web's team actions — invite a member. */
export async function POST(request: Request) {
  const auth = await getRouteContext("team", request);
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx, supabase } = auth;

  const { data: body, error } = await parseBody(request, inviteMemberSchema);
  if (error) return error;

  const result = await inviteMemberCore(supabase, ctx, body);
  if (!result.ok) return err(result.error, 400);
  return ok(result.data);
}

// A discriminated "action" field, rather than inferring intent from which
// fields are present, keeps the two mutations (role change vs. active
// toggle) unambiguous without reading the request body twice.
const patchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update_role"),
    memberId: z.string().uuid(),
    role: assignableRoleSchema,
  }),
  z.object({
    action: z.literal("set_active"),
    memberId: z.string().uuid(),
    isActive: z.boolean(),
  }),
]);

/** Update a member's role, or activate/deactivate them. */
export async function PATCH(request: Request) {
  const auth = await getRouteContext("team", request);
  if ("error" in auth) {
    return auth.error === "unauthorized" ? unauthorized() : forbidden();
  }
  const { ctx, supabase } = auth;

  const { data: body, error } = await parseBody(request, patchBodySchema);
  if (error) return error;

  const result =
    body.action === "update_role"
      ? await updateMemberRoleCore(supabase, ctx, {
          memberId: body.memberId,
          role: body.role,
        })
      : await setMemberActiveCore(supabase, ctx, body.memberId, body.isActive);

  if (!result.ok) return err(result.error, 400);
  return ok({});
}
