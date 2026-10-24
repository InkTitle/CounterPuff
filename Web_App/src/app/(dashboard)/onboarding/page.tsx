import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { quitPlans, userProducts, userProfiles, userTriggers } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "Build your profile" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
  const products = await db.select().from(userProducts).where(eq(userProducts.userId, user.id));
  const triggers = await db.select().from(userTriggers).where(eq(userTriggers.userId, user.id));
  const [plan] = await db.select().from(quitPlans).where(eq(quitPlans.userId, user.id)).limit(1);
  const draft = (profile?.onboardingDraft ?? {}) as {
    none?: boolean;
    plan?: "preparation" | "immediate";
    quitDate?: string;
  };
  const primary = triggers.find((t) => t.isPrimary) ?? triggers[0];
  return (
    <div>
      <PageHeader
        title="Build a personal tobacco profile"
        description="One step at a time. You can go back, save partial answers, and resume later."
      />
      <OnboardingFlow
        initialCountry={user.country}
        initialCurrency={user.currency}
        initialStep={profile?.onboardingStep || 1}
        initialNone={Boolean(draft.none) || ((profile?.onboardingStep ?? 0) > 1 && products.length === 0)}
        initialProducts={products.map((p) => ({
          productType: p.productType,
          quantityPerDay: p.quantityPerDay,
          packSize: p.packSize,
          pricePerPack: p.pricePerPack,
          monthlySpend: p.monthlySpend,
          isEstimate: p.isEstimate,
        }))}
        initialTriggers={triggers.map((t) => t.triggerKey)}
        initialLocalTime={primary?.localTime ?? ""}
        initialPlan={plan?.planType === "immediate" ? "immediate" : draft.plan === "immediate" ? "immediate" : "preparation"}
        initialQuitDate={profile?.quitDate ?? plan?.targetDate ?? draft.quitDate ?? ""}
      />
    </div>
  );
}
