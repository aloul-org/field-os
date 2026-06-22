import { requireTechnician } from "@/lib/auth/session";
import { CopilotChat } from "@/components/tech/CopilotChat";

export const metadata = { title: "Copilot" };

export default async function TechCopilotPage() {
  await requireTechnician();
  return (
    <div>
      <h1 className="mb-3 font-display text-xl font-bold tracking-tight">Copilot</h1>
      <CopilotChat />
    </div>
  );
}
