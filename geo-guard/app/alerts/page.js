import AppShell from "@/components/AppShell";
import AlertsClient from "@/components/AlertsClient";

export default function AlertsPage() {
  return (
    <AppShell
      eyebrow="Incident history"
      title="Alerts"
      subtitle="Normal, warning, and critical events stored with timestamps and location context."
    >
      <AlertsClient />
    </AppShell>
  );
}
