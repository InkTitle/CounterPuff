import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quitPlans, userProducts, userProfiles, userTriggers, users } from "@/db/schema";
import { jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { classifySupportTrack } from "@/lib/calculations";
import { isFeatureOn } from "@/lib/auth";
import { awardIfNeeded, ensureMissions } from "@/lib/progress";
import { onboardingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, auth.user.id)).limit(1);
  const products = await db.select().from(userProducts).where(eq(userProducts.userId, auth.user.id));
  const triggers = await db.select().from(userTriggers).where(eq(userTriggers.userId, auth.user.id));
  const plans = await db.select().from(quitPlans).where(eq(quitPlans.userId, auth.user.id));
  return jsonOk({ profile, products, triggers, plan: plans[0] ?? null });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("onboarding", auth.user.id))) return jsonError("Onboarding is currently unavailable.", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please review your answers.", 400, { fields: parsed.error.flatten().fieldErrors });
  const data = parsed.data;
  const userId = auth.user.id;

  await db
    .insert(userProfiles)
    .values({ userId, onboardingStep: data.step, onboardingDraft: data.draft ?? null })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        onboardingStep: data.step,
        onboardingDraft: data.draft ?? null,
        updatedAt: new Date(),
      },
    });

  if (data.products) {
    await db.delete(userProducts).where(eq(userProducts.userId, userId));
    const rows = data.products.filter((p) => p.productType !== "none");
    if (rows.length) {
      await db.insert(userProducts).values(
        rows.map((p) => ({
          userId,
          productType: p.productType,
          quantityPerDay: p.quantityPerDay ?? null,
          packSize: p.packSize ?? null,
          pricePerPack: p.pricePerPack ?? null,
          buyingFrequency: p.buyingFrequency ?? null,
          monthlySpend: p.monthlySpend ?? null,
          unitLabel: p.unitLabel ?? null,
          isEstimate: p.isEstimate ?? true,
          notes: p.notes ?? null,
        })),
      );
    }
  }

  if (data.triggers) {
    await db.delete(userTriggers).where(eq(userTriggers.userId, userId));
    if (data.triggers.length) {
      await db.insert(userTriggers).values(
        data.triggers.map((t, i) => ({
          userId,
          triggerKey: t.triggerKey,
          isPrimary: t.isPrimary ?? i === 0,
          localTime: t.localTime ?? null,
        })),
      );
    }
  }

  if (data.quitPlanType) {
    await db.delete(quitPlans).where(eq(quitPlans.userId, userId));
    await db.insert(quitPlans).values({
      userId,
      planType: data.quitPlanType,
      targetDate: data.quitDate ?? null,
      startedAt: data.quitPlanType === "immediate" ? new Date() : null,
      status: "active",
    });
  }

  const products = await db.select().from(userProducts).where(eq(userProducts.userId, userId));
  const track = classifySupportTrack(
    products.map((p) => ({
      productType: p.productType,
      quantityPerDay: p.quantityPerDay,
      packSize: p.packSize,
      pricePerPack: p.pricePerPack,
      monthlySpend: p.monthlySpend,
      isEstimate: p.isEstimate,
    })),
  );

  const profileUpdate: {
    updatedAt: Date;
    supportTrack: string;
    onboardingStep: number;
    quitPlanType?: string;
    quitDate?: string | null;
    mostChallengingTime?: string | null;
    onboardingComplete?: boolean;
  } = {
    updatedAt: new Date(),
    supportTrack: data.supportTrack || track.track,
    onboardingStep: Math.min(6, Math.max(0, data.step)),
  };
  if (data.quitPlanType) profileUpdate.quitPlanType = data.quitPlanType;
  if (data.quitDate !== undefined) profileUpdate.quitDate = data.quitDate || null;
  if (data.mostChallengingTime !== undefined) profileUpdate.mostChallengingTime = data.mostChallengingTime;
  if (data.complete) {
    profileUpdate.onboardingComplete = true;
    profileUpdate.onboardingStep = 6;
  }

  await db.update(userProfiles).set(profileUpdate).where(eq(userProfiles.userId, userId));

  if (data.country || data.currency) {
    await db
      .update(users)
      .set({
        ...(data.country ? { country: data.country } : {}),
        ...(data.currency ? { currency: data.currency } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  }

  if (data.complete) {
    await awardIfNeeded(userId);
    await ensureMissions(userId);
  }

  return jsonOk({ track, complete: Boolean(data.complete) });
}
