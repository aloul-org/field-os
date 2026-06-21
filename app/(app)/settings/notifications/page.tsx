import { SettingsPlaceholder } from "@/components/settings/SettingsPlaceholder";

export const metadata = { title: "Notifications" };

export default function NotificationsSettingsPage() {
  return (
    <SettingsPlaceholder
      title="Notifications"
      description="Choose which events notify you and on which channel (in-app, WhatsApp, SMS, email). Built in Phase 6."
    />
  );
}
