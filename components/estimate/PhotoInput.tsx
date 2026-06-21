"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PhotoData {
  data: string; // base64 (no data: prefix)
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  preview: string; // data URL for display
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoInput({
  photos,
  onChange,
  max = 4,
}: {
  photos: PhotoData[];
  onChange: (photos: PhotoData[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const next: PhotoData[] = [];
    for (const file of Array.from(files).slice(0, max - photos.length)) {
      if (!ACCEPTED.includes(file.type)) continue;
      const data = await readAsBase64(file);
      next.push({
        data,
        mediaType: file.type as PhotoData["mediaType"],
        preview: `data:${file.type};base64,${data}`,
      });
    }
    onChange([...photos, ...next].slice(0, max));
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={photos.length >= max}
      >
        <Camera className="h-4 w-4" /> Add photo
      </Button>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-lg border">
              <Image
                src={p.preview}
                alt={`Job photo ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                aria-label="Remove photo"
                onClick={() => onChange(photos.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 shadow"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
