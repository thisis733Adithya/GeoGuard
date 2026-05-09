import AppShell from "@/components/AppShell";
import SavedPlacesClient from "@/components/SavedPlacesClient";

export const metadata = {
  title: "Saved Places | Geo Guard",
  description: "Bookmarked hotels, restaurants, and safety-first recommendations.",
};

export default function SavedPlacesPage() {
  return (
    <AppShell
      eyebrow="Tourist Recommendations"
      title="Saved Places"
      subtitle="Your bookmarked safe stays, food stops, and emergency services."
    >
      <SavedPlacesClient />
    </AppShell>
  );
}
