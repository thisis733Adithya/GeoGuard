import AppShell from "@/components/AppShell";
import AdminDashboardClient from "@/components/AdminDashboardClient";

export const metadata = {
  title: "Admin Control Room | Geo Guard",
  description: "Real-time tourist safety monitoring, incident triage, risk zone management and SOS response center.",
};

export default function AdminPage() {
  return (
    <AppShell
      eyebrow="Admin Control Room"
      title="Safety Command Center"
      subtitle="Real-time monitoring of all tourists, live SOS alerts, risk zones, and safety metrics — refreshed every 5 seconds."
    >
      <AdminDashboardClient />
    </AppShell>
  );
}
