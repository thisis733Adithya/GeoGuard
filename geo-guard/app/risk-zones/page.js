import AppShell from "@/components/AppShell";
import RiskZonesClient from "@/components/RiskZonesClient";

export default function RiskZonesPage() {
  return (
    <AppShell
      eyebrow="Geo-fencing"
      title="Risk Zones"
      subtitle="Restricted and high-risk areas are checked with a simple Haversine distance function."
    >
      <RiskZonesClient />
    </AppShell>
  );
}
