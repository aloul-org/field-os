"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";

import { useOnboarding } from "@/store/onboarding";
import { teamInviteSchema, type TeamInviteInput } from "@/lib/validations/onboarding";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamRole } from "@/lib/types/database";

const INVITABLE_ROLES: TeamRole[] = [
  "admin",
  "dispatcher",
  "estimator",
  "technician",
  "viewer",
];

function blankInvite(): TeamInviteInput {
  return { name: "", email: "", role: "technician" };
}

export function TeamStep() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const router = useRouter();
  const { team, setTeam } = useOnboarding();

  const [mode, setMode] = useState<"choose" | "team">(
    team.length > 0 ? "team" : "choose"
  );
  const [invites, setInvites] = useState<TeamInviteInput[]>(
    team.length > 0 ? team : [blankInvite()]
  );
  const [errors, setErrors] = useState<string[]>([]);

  function update(index: number, patch: Partial<TeamInviteInput>) {
    setInvites((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function continueWithTeam() {
    // Keep only filled rows, validate each.
    const filled = invites.filter((r) => r.name || r.email);
    const nextErrors: string[] = [];
    filled.forEach((row, i) => {
      const res = teamInviteSchema.safeParse(row);
      if (!res.success) nextErrors[i] = res.error.issues[0]?.message ?? "Invalid";
    });
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }
    setTeam(filled);
    router.push("/onboarding/integrations");
  }

  function continueSolo() {
    setTeam([]);
    router.push("/onboarding/integrations");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("teamTitle")}</h1>

      {mode === "choose" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={continueSolo}
            className="rounded-xl border p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <p className="font-medium">{t("sizeSolo")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tc("continue")} →
            </p>
          </button>
          <button
            type="button"
            onClick={() => setMode("team")}
            className="rounded-xl border p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted"
          >
            <p className="font-medium">{t("addAnother")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("name")} · {t("role")}
            </p>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((row, i) => (
            <div
              key={i}
              className="grid items-end gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <div className="space-y-1">
                <Label htmlFor={`name-${i}`}>{t("name")}</Label>
                <Input
                  id={`name-${i}`}
                  value={row.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`email-${i}`}>Email</Label>
                <Input
                  id={`email-${i}`}
                  type="email"
                  value={row.email}
                  onChange={(e) => update(i, { email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("role")}</Label>
                <Select
                  value={row.role}
                  onValueChange={(v) => update(i, { role: v as TeamRole })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() =>
                  setInvites((prev) => prev.filter((_, idx) => idx !== i))
                }
                disabled={invites.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {errors[i] && (
                <p className="text-sm text-destructive sm:col-span-4">
                  {errors[i]}
                </p>
              )}
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setInvites((prev) => [...prev, blankInvite()])}
            >
              <Plus className="h-4 w-4" /> {t("addAnother")}
            </Button>
            <button
              type="button"
              onClick={continueSolo}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("inviteLater")}
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/onboarding/pricing-defaults")}
        >
          {tc("back")}
        </Button>
        {mode === "team" && (
          <Button type="button" size="lg" onClick={continueWithTeam}>
            {tc("continue")}
          </Button>
        )}
      </div>
    </div>
  );
}
