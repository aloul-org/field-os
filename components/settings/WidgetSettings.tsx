"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";

import { setWidgetEnabled } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export function WidgetSettings({
  widgetKey,
  enabled,
  appUrl,
  canWrite,
}: {
  widgetKey: string;
  enabled: boolean;
  appUrl: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="${appUrl}/widget.js" data-widget-key="${widgetKey}" defer></script>`;

  async function toggle(next: boolean) {
    setOn(next);
    setBusy(true);
    const result = await setWidgetEnabled(next);
    setBusy(false);
    if (!result.ok) {
      setOn(!next);
      toast({ variant: "destructive", description: result.error });
      return;
    }
    router.refresh();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", description: "Couldn't copy — select it manually." });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium">Website widget</p>
          <p className="text-sm text-muted-foreground">
            A &ldquo;Get a quote&rdquo; button visitors can use to send you a lead.
          </p>
        </div>
        <Switch checked={on} onCheckedChange={toggle} disabled={busy || !canWrite} />
      </div>

      {on && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Paste this just before <code className="font-mono">&lt;/body&gt;</code> on your site:
          </p>
          <div className="flex items-start gap-2">
            <pre className="flex-1 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
              {snippet}
            </pre>
            <Button type="button" variant="outline" size="icon" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
