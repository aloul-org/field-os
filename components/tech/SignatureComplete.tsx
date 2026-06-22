"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eraser } from "lucide-react";

import { completeJobWithSignature } from "@/app/tech/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * Full-width signature canvas + customer name, gating job completion. Captures
 * pointer/touch strokes, exports a PNG data URL, and calls the completion action.
 */
export function SignatureComplete({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasInk = useRef(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Size the backing store to the displayed size for crisp strokes.
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#15181B";
    }
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasInk.current = true;
  }

  function up() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasInk.current = false;
  }

  async function complete() {
    if (!hasInk.current) {
      toast({ variant: "destructive", description: "Ask the customer to sign first." });
      return;
    }
    if (!name.trim()) {
      toast({ variant: "destructive", description: "Enter the customer's name." });
      return;
    }
    // Composite onto white (the canvas is transparent) before exporting.
    const src = canvasRef.current;
    if (!src) return;
    const out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    const octx = out.getContext("2d");
    if (!octx) return;
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(src, 0, 0);
    const dataUrl = out.toDataURL("image/png");

    setSaving(true);
    const res = await completeJobWithSignature({
      jobId,
      signatureDataUrl: dataUrl,
      signedByName: name.trim(),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ variant: "destructive", description: res.error });
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="sig-name">Customer name</Label>
        <Input
          id="sig-name"
          className="h-12"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Who is signing?"
        />
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="h-40 w-full touch-none rounded-md border-2 border-dashed border-border bg-white"
        />
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
        >
          <Eraser className="h-3.5 w-3.5" /> Clear
        </button>
      </div>
      <Button className="h-14 w-full text-base" disabled={saving} onClick={complete}>
        <CheckCircle2 className="h-5 w-5" />
        {saving ? "Completing…" : "Complete job"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Completing notifies the office so they can send the invoice.
      </p>
    </div>
  );
}
