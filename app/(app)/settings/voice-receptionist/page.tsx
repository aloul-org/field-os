import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata = { title: "Voice receptionist" };

export default function VoiceReceptionistSettingsPage() {
  return (
    <SettingsPlaceholder
      title="AI voice receptionist"
      description="Provision a number, set your greeting and routing. Built in Phase 3."
    />
  );
}
