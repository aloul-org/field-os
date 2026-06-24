import Link from "next/link";
import { Phone, FileText, TrendingUp } from "lucide-react";

import { publicEnv } from "@/lib/env";
import { RouteLine } from "@/components/shared/RouteLine";

const HIGHLIGHTS = [
  { icon: Phone, title: "Never miss a job", body: "The AI answers calls and books leads, day or night." },
  { icon: FileText, title: "Quote from a photo", body: "Turn a snap into a priced quote in minutes." },
  { icon: TrendingUp, title: "Know your real profit", body: "See what every job actually made, the moment you're paid." },
];

/** Two-column auth scaffold: a branded story panel + the form. Used by the
 * login / register / reset pages (not onboarding, which needs full width). */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:grid lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-[#15181B] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(40rem 40rem at 110% -10%, rgba(255,90,31,0.35), transparent 55%), radial-gradient(32rem 32rem at -10% 120%, rgba(255,90,31,0.20), transparent 55%)",
          }}
        />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2.5 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">
              F
            </span>
            <span className="font-display text-lg">{publicEnv.appName}</span>
          </Link>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight">
            Run your whole trade business from one place.
          </h1>
          <RouteLine className="mt-6 max-w-xs" />
          <ul className="mt-8 space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/10 text-primary ring-1 ring-white/10">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} {publicEnv.appName}. Built for the trades.
        </p>
      </aside>

      {/* Form side */}
      <div className="flex flex-1 flex-col">
        <header className="p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">
              F
            </span>
            <span className="font-display">{publicEnv.appName}</span>
          </Link>
        </header>
        <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:pt-0">
          <div className="w-full max-w-md animate-slide-up-fade">{children}</div>
        </main>
      </div>
    </div>
  );
}
