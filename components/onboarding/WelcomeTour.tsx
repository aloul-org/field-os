"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Sparkles,
  Command,
  LayoutDashboard,
  Inbox,
  CalendarDays,
  FileText,
  Receipt,
  TrendingUp,
  Bot,
  Settings,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  X,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useTour } from "@/lib/stores/tour";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "fieldos.tour.v1";

type Step = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  /** Only shown if this route is available to the user (omit = always shown). */
  requires?: string;
  href?: string;
};

const ALL_STEPS: Step[] = [
  {
    id: "intro",
    icon: Sparkles,
    title: "Welcome to FieldOS",
    body: "A quick tour of where everything lives — about 60 seconds. You can replay it anytime from your profile menu.",
  },
  {
    id: "command",
    icon: Command,
    title: "Jump anywhere with ⌘K",
    body: "Press Ctrl / ⌘ + K on any screen to search and jump to any page — or start a quick action like a new estimate.",
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Your daily dashboard",
    body: "Revenue this month, today's jobs, and anything that needs you — hot leads, emergency jobs, overdue invoices.",
    requires: "/dashboard",
    href: "/dashboard",
  },
  {
    id: "leads",
    icon: Inbox,
    title: "Leads land here",
    body: "Every enquiry from your website, phone, WhatsApp and SMS arrives here, scored hot / warm / cold so you chase the best first.",
    requires: "/leads",
    href: "/leads",
  },
  {
    id: "schedule",
    icon: CalendarDays,
    title: "Schedule & dispatch",
    body: "Place jobs on your team's day, let the AI suggest the best technician and slot, and optimise the driving route.",
    requires: "/schedule",
    href: "/schedule",
  },
  {
    id: "estimates",
    icon: FileText,
    title: "Quote in minutes",
    body: "Turn a photo or a few words into a priced quote. Send it; customers accept online and it becomes a job automatically.",
    requires: "/estimates",
    href: "/estimates",
  },
  {
    id: "invoices",
    icon: Receipt,
    title: "Get paid faster",
    body: "Raise an invoice from a job, send a payment link, and mark it paid — profit is worked out the moment money lands.",
    requires: "/invoices",
    href: "/invoices",
  },
  {
    id: "finance",
    icon: TrendingUp,
    title: "Know your numbers",
    body: "Real profit per job, technician, service and customer — plus a revenue forecast for next month.",
    requires: "/finance",
    href: "/finance",
  },
  {
    id: "coach",
    icon: Bot,
    title: "Ask the AI Coach",
    body: "Ask plain questions about your business — “Why did we lose estimates last month?” — answered from your own data.",
    requires: "/coach",
    href: "/coach",
  },
  {
    id: "settings",
    icon: Settings,
    title: "Set up your business",
    body: "Your rates, VAT, branding, the website lead-capture widget and your team all live in Settings.",
    requires: "/settings",
    href: "/settings",
  },
  {
    id: "finish",
    icon: CheckCircle2,
    title: "You're all set",
    body: "That's the tour. Want detail on any single screen? Open the full user manual anytime.",
  },
];

export function WelcomeTour({ available }: { available: string[] }) {
  const { open, setOpen } = useTour();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const steps = useMemo(
    () => ALL_STEPS.filter((s) => !s.requires || available.includes(s.requires)),
    [available]
  );

  // Auto-open once for brand-new users.
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_KEY)) {
        const id = window.setTimeout(() => setOpen(true), 700);
        return () => window.clearTimeout(id);
      }
    } catch {
      /* localStorage unavailable — skip auto-open */
    }
  }, [setOpen]);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  function finish() {
    try {
      localStorage.setItem(TOUR_KEY, "done");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;
  const Icon = current.icon;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => (o ? setOpen(true) : finish())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm animate-overlay-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-card-hover animate-command-in focus:outline-none">
          {/* Branded header band with the route line */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-5 pt-7">
            <Dialog.Close
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close tour"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <Dialog.Title className="mt-4 font-display text-xl font-bold tracking-tight">
              {current.title}
            </Dialog.Title>
            <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
              {current.body}
            </Dialog.Description>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 py-4">
            {steps.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-5 bg-primary" : "w-1.5 bg-border hover:bg-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between gap-2 border-t px-4 py-3">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={finish}>
                Skip tour
              </Button>
            )}

            <div className="flex items-center gap-2">
              {current.href && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    finish();
                    router.push(current.href!);
                  }}
                >
                  Take me there
                </Button>
              )}
              {isLast ? (
                <>
                  <Button asChild variant="outline" size="sm">
                    <a href="/USER_MANUAL.html" target="_blank" rel="noopener noreferrer">
                      <BookOpen className="h-4 w-4" /> Manual
                    </a>
                  </Button>
                  <Button size="sm" onClick={finish}>
                    Get started
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
