import Link from "next/link";

import { publicEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { TRADES } from "@/lib/trades";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              F
            </span>
            <span>{publicEnv.appName}</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/features" className="text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/about" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Start free trial</Link>
            </Button>
          </nav>
          <Button asChild size="sm" className="md:hidden">
            <Link href="/register">Start free trial</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm">
          <div className="flex flex-col justify-between gap-6 sm:flex-row">
            <div>
              <p className="font-semibold">{publicEnv.appName}</p>
              <p className="mt-1 max-w-xs text-muted-foreground">
                Run your entire service company from one AI-powered platform.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-muted-foreground">
              <span className="font-medium text-foreground">Built for:</span>
              {TRADES.filter((t) => t.value !== "other").map((trade, i, arr) => (
                <span key={trade.slug}>
                  <Link href={`/trades/${trade.slug}`} className="hover:text-foreground">
                    {trade.label}
                  </Link>
                  {i < arr.length - 1 ? " ·" : ""}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {publicEnv.appName}. UK & Germany.
          </p>
        </div>
      </footer>
    </div>
  );
}
