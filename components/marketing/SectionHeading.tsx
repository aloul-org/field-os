import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/Reveal";

/** Consistent centred section heading for marketing pages. */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  className,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </Reveal>
  );
}
