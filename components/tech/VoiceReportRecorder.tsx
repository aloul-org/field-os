"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { enqueue } from "@/lib/tech/outbox";

/**
 * Records a spoken job report, sends it for Whisper transcription + AI
 * formatting (Module 4). Falls back to a typed note if the device has no
 * microphone access or recording isn't supported.
 */
export function VoiceReportRecorder({
  jobId,
  existingReport,
}: {
  jobId: string;
  existingReport: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [report, setReport] = useState(existingReport ?? "");
  const [typedMode, setTypedMode] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void upload(new Blob(chunksRef.current, { type: recorder.mimeType }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast({
        variant: "destructive",
        description: "Couldn't access the mic — you can type the report instead.",
      });
      setTypedMode(true);
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function upload(blob: Blob) {
    setProcessing(true);
    const fd = new FormData();
    fd.set("jobId", jobId);
    fd.set("audio", blob, "report.webm");
    try {
      if (!navigator.onLine) {
        await enqueue({ kind: "voice", jobId, blob, filename: "report.webm", createdAt: Date.now() });
        toast({ description: "Saved — your report will upload when you're back online." });
        return;
      }
      const res = await fetch("/api/tech/voice-report", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Couldn't process the recording." });
        setTypedMode(true);
        return;
      }
      setReport(json.data.report);
      toast({ description: "Report saved." });
      router.refresh();
    } catch {
      // Network error → queue the audio for retry.
      await enqueue({ kind: "voice", jobId, blob, filename: "report.webm", createdAt: Date.now() });
      toast({ description: "Saved — your report will upload when you're back online." });
    } finally {
      setProcessing(false);
    }
  }

  async function saveTyped() {
    setProcessing(true);
    const fd = new FormData();
    fd.set("jobId", jobId);
    fd.set("text", report);
    try {
      const res = await fetch("/api/tech/voice-report", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Couldn't save." });
        return;
      }
      setReport(json.data.report);
      toast({ description: "Report saved." });
      router.refresh();
    } finally {
      setProcessing(false);
    }
  }

  if (report && !typedMode) {
    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap rounded-md border border-border p-3 text-sm">
          {report}
        </p>
        <Button variant="outline" className="h-12 w-full" onClick={() => setTypedMode(true)}>
          Edit report
        </Button>
      </div>
    );
  }

  if (typedMode) {
    return (
      <div className="space-y-3">
        <Textarea
          rows={5}
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Describe what you did, parts used, anything to follow up…"
        />
        <Button className="h-12 w-full" disabled={processing || !report.trim()} onClick={saveTyped}>
          {processing ? "Saving…" : "Save report"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {processing ? (
        <Button disabled className="h-14 w-full text-base">
          <Loader2 className="h-5 w-5 animate-spin" /> Thinking about your job…
        </Button>
      ) : recording ? (
        <Button variant="destructive" className="h-14 w-full text-base" onClick={stop}>
          <Square className="h-5 w-5" /> Stop &amp; save
        </Button>
      ) : (
        <Button className="h-14 w-full text-base" onClick={start}>
          <Mic className="h-5 w-5" /> Record voice report
        </Button>
      )}
      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground underline"
        onClick={() => setTypedMode(true)}
      >
        or type it instead
      </button>
    </div>
  );
}
