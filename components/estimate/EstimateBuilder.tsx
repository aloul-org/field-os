"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Mic, MicOff, Loader2 } from "lucide-react";

import { createEstimate } from "@/app/(app)/estimates/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CustomerPicker,
  type PickedCustomer,
} from "@/components/estimate/CustomerPicker";
import { PhotoInput, type PhotoData } from "@/components/estimate/PhotoInput";
import {
  LineItemsEditor,
  type EditableLineItem,
} from "@/components/estimate/LineItemsEditor";
import { ConfidenceBanner } from "@/components/estimate/ConfidenceBanner";

interface ExtractResponse {
  job_title: string;
  summary_for_customer: string;
  estimated_duration_hours: number | null;
  ai_confidence: "high" | "medium" | "low";
  ai_flags: string[];
  line_items: (EditableLineItem & { line_total: number })[];
  vat_rate: number;
}

// Minimal typing for the Web Speech API (avoids `any`); dictation is a
// progressive enhancement for the Speak tab and silently no-ops if unsupported.
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void)
    | null;
  onend: (() => void) | null;
}

export function EstimateBuilder({
  initialCustomer,
  region,
}: {
  initialCustomer: PickedCustomer | null;
  region: "UK" | "DE";
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<PickedCustomer | null>(initialCustomer);
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Draft (editable after extraction or built manually).
  const [hasDraft, setHasDraft] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [vatRate, setVatRate] = useState(region === "DE" ? 0.19 : 0.2);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low" | null>(null);
  const [flags, setFlags] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);

  function applyDraft(d: ExtractResponse) {
    setJobTitle(d.job_title);
    setSummary(d.summary_for_customer);
    setVatRate(d.vat_rate);
    setConfidence(d.ai_confidence);
    setFlags(d.ai_flags);
    setLineItems(
      d.line_items.map((li) => ({
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        kind: li.kind,
      }))
    );
    setHasDraft(true);
  }

  async function generate() {
    if (!description.trim() && photos.length === 0) {
      toast({ variant: "destructive", description: "Describe the job or add a photo first." });
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch("/api/estimate/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || undefined,
          customer_id: customer?.id,
          property_id: customer?.propertyId ?? undefined,
          images: photos.map((p) => ({ data: p.data, mediaType: p.mediaType })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        toast({ variant: "destructive", description: json.error ?? "Could not generate the estimate." });
        return;
      }
      applyDraft(json.data as ExtractResponse);
    } catch {
      toast({ variant: "destructive", description: "Network error — please try again." });
    } finally {
      setExtracting(false);
    }
  }

  function startManual() {
    setLineItems([{ description: "", quantity: 1, unit_price: 0, kind: "labour" }]);
    setHasDraft(true);
  }

  function toggleDictation() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const ctor =
      (window as unknown as {
        SpeechRecognition?: new () => SpeechRecognitionLike;
        webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!ctor) {
      toast({ description: "Voice input isn't supported in this browser — please type instead." });
      return;
    }
    const rec = new ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = region === "DE" ? "de-DE" : "en-GB";
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setDescription((prev) => (prev ? `${prev} ${text}` : text).trim());
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  async function save() {
    if (!customer) {
      toast({ variant: "destructive", description: "Select a customer first." });
      return;
    }
    if (!jobTitle.trim() || lineItems.length === 0) {
      toast({ variant: "destructive", description: "Add a job title and at least one line item." });
      return;
    }
    setSaving(true);
    const result = await createEstimate({
      customer_id: customer.id,
      property_id: customer.propertyId ?? null,
      job_title: jobTitle.trim(),
      job_description_raw: description.trim() || null,
      summary_for_customer: summary.trim() || jobTitle.trim(),
      line_items: lineItems.map((li) => ({
        description: li.description,
        quantity: Number(li.quantity) || 0,
        unit_price: Number(li.unit_price) || 0,
        kind: li.kind,
      })),
      ai_confidence: confidence,
      ai_flags: flags,
      photo_urls: [],
    });
    setSaving(false);
    if (!result.ok) {
      toast({ variant: "destructive", description: result.error });
      return;
    }
    router.push(`/estimates/${result.data.id}`);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPicker value={customer} onChange={setCustomer} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe the job</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="type">
            <TabsList>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="photo">Photo</TabsTrigger>
              <TabsTrigger value="speak">Speak</TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="space-y-3">
              <Textarea
                rows={5}
                placeholder="e.g. Replace a leaking 15mm isolation valve under the kitchen sink, supply and fit, about an hour's labour."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="photo" className="space-y-3">
              <PhotoInput photos={photos} onChange={setPhotos} />
              <Textarea
                rows={2}
                placeholder="Optional: add any context about the photos…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="speak" className="space-y-3">
              <Button
                type="button"
                variant={listening ? "destructive" : "outline"}
                onClick={toggleDictation}
              >
                {listening ? (
                  <>
                    <MicOff className="h-4 w-4" /> Stop dictation
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Start dictation
                  </>
                )}
              </Button>
              <Textarea
                rows={4}
                placeholder="Your spoken words appear here — edit as needed."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={generate} disabled={extracting}>
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Working out the estimate…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate estimate
                </>
              )}
            </Button>
            {!hasDraft && (
              <Button type="button" variant="ghost" onClick={startManual}>
                Build manually
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {hasDraft && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review &amp; edit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfidenceBanner confidence={confidence} flags={flags} />
            <div className="space-y-1.5">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="summary">Summary for the customer</Label>
              <Textarea
                id="summary"
                rows={3}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Line items</Label>
              <LineItemsEditor
                items={lineItems}
                onChange={setLineItems}
                vatRate={vatRate}
                region={region}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} size="lg">
                {saving ? "Saving…" : "Save draft estimate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
