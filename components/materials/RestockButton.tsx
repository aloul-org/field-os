"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Copy, Check } from "lucide-react";

import { createMaterialRequest } from "@/app/(app)/materials/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

/** Drafts (and emails, if possible) a restock request for one material. */
export function RestockButton({
  materialId,
  materialName,
  suggestedQty,
}: {
  materialId: string;
  materialName: string;
  suggestedQty: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(suggestedQty);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [drafted, setDrafted] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit() {
    setSaving(true);
    const res = await createMaterialRequest({
      material_id: materialId,
      quantity_requested: Number(qty) || 1,
      notes,
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.refresh();
    if (res.data.emailed) {
      toast({ description: "Request emailed to the supplier." });
      setOpen(false);
    } else {
      // No supplier email on file — show the text to copy/send manually.
      setDrafted(res.data.requestText);
    }
  }

  async function copy() {
    if (!drafted) return;
    try {
      await navigator.clipboard.writeText(drafted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", description: "Couldn't copy." });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setDrafted(null);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Truck className="h-4 w-4" /> Restock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restock {materialName}</DialogTitle>
        </DialogHeader>
        {drafted ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No supplier email on file — copy this request and send it however you like.
            </p>
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{drafted}</pre>
            <Button onClick={copy} variant="outline" className="w-full">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy request"}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.valueAsNumber || 1)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. needed by Friday"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Drafting…" : "Create request"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
