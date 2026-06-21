"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function DownloadPdfButton({
  endpoint,
  id,
  existingUrl,
}: {
  endpoint: string;
  id: string;
  existingUrl: string | null;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (res.ok && json.ok && json.data?.url) {
        window.open(json.data.url as string, "_blank", "noopener");
        return;
      }
      toast({ variant: "destructive", description: json.error ?? "Could not generate the PDF." });
    } catch {
      toast({ variant: "destructive", description: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  if (existingUrl) {
    return (
      <Button asChild variant="outline" className="w-full">
        <a href={existingUrl} target="_blank" rel="noopener noreferrer">
          <FileDown className="h-4 w-4" /> Download PDF
        </a>
      </Button>
    );
  }

  return (
    <Button variant="outline" className="w-full" onClick={generate} disabled={busy}>
      <FileDown className="h-4 w-4" /> {busy ? "Generating PDF…" : "Generate PDF"}
    </Button>
  );
}
