"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type PhotoType = "before" | "progress" | "after" | "issue";

/** Big "Add photo" button — opens the camera directly on mobile (capture). */
export function TechPhotoUpload({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<PhotoType>("progress");
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.set("jobId", jobId);
    fd.set("photoType", type);
    fd.set("file", file);
    try {
      const res = await fetch("/api/tech/photo", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Upload failed." });
        return;
      }
      toast({ description: "Photo added." });
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        description: "Couldn't upload — check your signal and try again.",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <Select value={type} onValueChange={(v) => setType(v as PhotoType)}>
        <SelectTrigger className="h-12">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="before">Before</SelectItem>
          <SelectItem value="progress">Progress</SelectItem>
          <SelectItem value="after">After</SelectItem>
          <SelectItem value="issue">Issue found</SelectItem>
        </SelectContent>
      </Select>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <Button
        type="button"
        className="h-14 w-full text-base"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="h-5 w-5" />
        {uploading ? "Uploading…" : "Add photo"}
      </Button>
    </div>
  );
}
