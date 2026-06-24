import Link from "next/link";

import { cn } from "@/lib/utils";

type Accent = "default" | "primary" | "success" | "warning" | "destructive";

/** Status rail down the left edge — like the colour stripe on a paper work order. */
const ACCENT_CLASS: Record<Accent, string> = {
  default: "bg-border group-hover:bg-primary/50",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

/**
 * The signature "Job Ticket" card — perforated top edge (.job-ticket in
 * globals.css), a status rail down the left, and the standard hover lift. Used
 * for the primary item in a list view (lead/estimate/invoice/job rows).
 */
export function JobTicketCard({
  href,
  accent = "default",
  className,
  children,
}: {
  href: string;
  accent?: Accent;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "job-ticket group relative block rounded-xl border bg-card p-4 pl-5 shadow-card transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute bottom-3 left-0 top-3 w-1 rounded-r-full transition-colors duration-150",
          ACCENT_CLASS[accent]
        )}
      />
      {children}
    </Link>
  );
}
