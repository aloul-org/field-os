import Link from "next/link";

import { cn } from "@/lib/utils";

/** The signature "Job Ticket" card — perforated top edge via the .job-ticket
 * class in globals.css, plus the standard card-hover lift (design-prompt.md).
 * Use for the primary item in a list view (estimate/invoice/job rows). */
export function JobTicketCard({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "job-ticket block rounded-xl border bg-card p-4 shadow-card transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </Link>
  );
}
