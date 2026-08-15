"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  suspendCompany,
  reactivateCompany,
} from "@/app/(platform)/admin/companies/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function CompanyAdminActions({
  companyId,
  isSuspended,
}: {
  companyId: string;
  isSuspended: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleReactivate() {
    setBusy(true);
    const res = await reactivateCompany(companyId);
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.refresh();
  }

  async function handleSuspend() {
    setBusy(true);
    const res = await suspendCompany(companyId, reason);
    setBusy(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    setOpen(false);
    setReason("");
    router.refresh();
  }

  if (isSuspended) {
    return (
      <Button variant="outline" onClick={handleReactivate} disabled={busy}>
        {t("reactivate")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">{t("suspend")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("suspendConfirmTitle")}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{t("suspendConfirmBody")}</p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t("suspendReasonPlaceholder")}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleSuspend} disabled={busy}>
            {busy ? t("suspending") : t("suspend")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
