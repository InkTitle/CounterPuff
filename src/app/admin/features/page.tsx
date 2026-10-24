import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { FeatureToggles } from "@/components/feature-toggles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Feature management" };

export default async function FeaturesPage() {
  const flags = await db.select().from(featureFlags);
  return (
    <div>
      <PageHeader title="Feature flags" description="Disabling a flag hides the UI path and rejects the matching APIs." />
      <FeatureToggles flags={flags} />
    </div>
  );
}
