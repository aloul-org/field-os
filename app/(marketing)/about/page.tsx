import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Why we built FieldOS AI</h1>
      <div className="mt-8 space-y-4 text-muted-foreground">
        <p>
          Field service software has spent twenty years digitising paperwork.
          The job sheet became a screen, the invoice became a PDF — but the owner
          still runs the business from their head, a notebook and three apps that
          don&apos;t talk to each other.
        </p>
        <p>
          We think the next decade is different. The same AI that can answer a
          phone, read a photo of a leaking boiler and write a professional quote
          can run the connective tissue of a service company — so a two-person
          plumbing firm can operate like one with a back office of ten.
        </p>
        <p>
          FieldOS AI is built for the trades, in the UK and Germany first, with
          VAT, billing and language done properly for each market. One platform,
          an AI layer through every part of it.
        </p>
      </div>
      <div className="mt-10">
        <Button asChild size="lg">
          <Link href="/register">Start your free trial</Link>
        </Button>
      </div>
    </div>
  );
}
