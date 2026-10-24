import { SosExperience, SosOfflineBanner } from "@/components/sos-tools";
import { HealthDisclaimer, PageHeader } from "@/components/ui";

export const metadata = { title: "Craving SOS" };

export default function SosPage() {
  return (
    <div>
      <PageHeader
        title="Craving SOS"
        description="This is a few-minute workspace. Pick one tool, stay with it, then decide the next small action."
      />
      <SosOfflineBanner />
      <SosExperience />
      <div className="mt-6">
        <HealthDisclaimer />
      </div>
    </div>
  );
}
