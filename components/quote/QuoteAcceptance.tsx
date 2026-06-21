"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type Status = "sent" | "accepted" | "rejected";

export function QuoteAcceptance({
  token,
  initialStatus,
  companyName,
  accentColour,
}: {
  token: string;
  initialStatus: Status;
  companyName: string;
  accentColour: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [busy, setBusy] = useState<"accept" | "reject" | null>(null);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(action: "accept" | "reject") {
    setBusy(action);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/public/quote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setErrorMsg(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus(json.data.status as Status);
    } catch {
      setErrorMsg("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  }

  if (status === "accepted") {
    return (
      <div className="rounded-xl border bg-success/10 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h2 className="mt-3 text-lg font-semibold">Thank you!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {companyName} will be in touch to schedule the work.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-xl border bg-muted p-6 text-center">
        <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 text-lg font-semibold">Quote declined</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Thanks for letting {companyName} know.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      <Button
        size="xl"
        className="w-full"
        onClick={() => submit("accept")}
        disabled={busy !== null}
        style={accentColour ? { backgroundColor: accentColour } : undefined}
      >
        {busy === "accept" ? "Accepting…" : "Accept this quote"}
      </Button>

      {confirmDecline ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setConfirmDecline(false)}
            disabled={busy !== null}
          >
            Keep
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => submit("reject")}
            disabled={busy !== null}
          >
            {busy === "reject" ? "Declining…" : "Confirm decline"}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setConfirmDecline(true)}
          disabled={busy !== null}
        >
          Decline
        </Button>
      )}
    </div>
  );
}
