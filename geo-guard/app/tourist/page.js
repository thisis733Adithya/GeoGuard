import AppShell from "@/components/AppShell";
import TouristDashboardClient from "@/components/TouristDashboardClient";

export const metadata = {
  title: "Tourist Dashboard | Geo Guard",
  description: "Your personal safety dashboard — live location, alerts, weather, and nearby trusted places.",
};

export default function TouristPage() {
  return (
    <AppShell
      eyebrow="Tourist Safety"
      title="Your Safety Dashboard"
      subtitle="Track your safety score, share location, get weather alerts, and discover trusted nearby hotels & restaurants."
    >
      <TouristDashboardClient />
    </AppShell>
  );
}
