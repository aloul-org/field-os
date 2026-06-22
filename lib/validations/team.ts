import { z } from "zod";

// Owner is never assignable via invite/role-change — there is exactly one, set at
// company creation.
export const assignableRoleSchema = z.enum([
  "admin",
  "dispatcher",
  "estimator",
  "technician",
  "viewer",
]);

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(120),
  email: z.string().trim().email("Enter a valid email").max(160),
  role: assignableRoleSchema,
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const updateRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: assignableRoleSchema,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
