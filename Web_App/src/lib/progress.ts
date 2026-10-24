import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import {
  cravingSessions,
  dailyLogs,
  readingProgress,
  userAchievements,
  userMissions,
  userProducts,
  userProfiles,
  userTriggers,
  quitPlans,
  achievements,
  ebookVersions,
} from "@/db/schema";
import {
  classifySupportTrack,
  combinedDailyCost,
  environmentalEstimates,
  formatMoney,
  rangeFromFilter,
  savingsForRange,
  smokeFreeStreak,
  type ProductUsage,
} from "./calculations";
import type { SessionUser } from "./auth";

export async function loadProfileBundle(userId: string) {
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const products = await db.select().from(userProducts).where(and(eq(userProducts.userId, userId), eq(userProducts.active, true)));
  const triggers = await db.select().from(userTriggers).where(eq(userTriggers.userId, userId));
  const plans = await db.select().from(quitPlans).where(eq(quitPlans.userId, userId)).orderBy(desc(quitPlans.createdAt));
  return { profile, products, triggers, plan: plans[0] ?? null };
}

export async function computeDashboard(user: SessionUser, filter: "daily" | "weekly" | "monthly" | "yearly" = "weekly") {
  const { profile, products, triggers, plan } = await loadProfileBundle(user.id);
  const usage: ProductUsage[] = products.map((p) => ({
    productType: p.productType,
    quantityPerDay: p.quantityPerDay,
    packSize: p.packSize,
    pricePerPack: p.pricePerPack,
    monthlySpend: p.monthlySpend,
    isEstimate: p.isEstimate,
  }));
  const logs = await db.select().from(dailyLogs).where(eq(dailyLogs.userId, user.id));
  const logLike = logs.map((l) => ({
    logDate: l.logDate,
    smokeFree: l.smokeFree,
    lapse: l.lapse,
    amountSpent: l.amountSpent,
    quantityUsed: l.quantityUsed,
  }));
  const quitDate = profile?.quitDate ?? plan?.targetDate ?? null;
  const { from, to } = rangeFromFilter(filter);
  const savings = savingsForRange({ products: usage, logs: logLike, quitDate, from, to });
  const allTime = savingsForRange({
    products: usage,
    logs: logLike,
    quitDate,
    from: quitDate ? new Date(quitDate + "T00:00:00Z") : from,
    to,
  });
  const streak = smokeFreeStreak(logLike, quitDate);
  const cravings = await db
    .select()
    .from(cravingSessions)
    .where(eq(cravingSessions.userId, user.id))
    .orderBy(desc(cravingSessions.createdAt));
  const managed = cravings.filter((c) => c.outcome === "eased" || c.outcome === "somewhat").length;
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  let reading = null;
  if (ebook) {
    const [rp] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, user.id), eq(readingProgress.ebookId, ebook.id)))
      .limit(1);
    reading = rp ?? null;
  }
  const earned = await db
    .select({ achievement: achievements, earnedAt: userAchievements.earnedAt })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(eq(userAchievements.userId, user.id));
  const missions = await db
    .select()
    .from(userMissions)
    .where(eq(userMissions.userId, user.id))
    .orderBy(desc(userMissions.createdAt));
  const env = environmentalEstimates({ products: usage, smokeFreeDays: allTime.daysCounted - allTime.daysWithLapse });
  const daily = combinedDailyCost(usage);
  const track = classifySupportTrack(usage);

  return {
    profile,
    products,
    triggers,
    plan,
    usage,
    savings,
    allTime,
    streak,
    cravingsCount: cravings.length,
    managed,
    recentCravings: cravings.slice(0, 8),
    ebook,
    reading,
    earned,
    missions,
    env,
    dailySpend: daily,
    moneyLabel: (n: number) => formatMoney(n, user.currency),
    track,
    quitDate,
    filter,
  };
}

export async function awardIfNeeded(userId: string) {
  const { products } = await loadProfileBundle(userId);
  const cravings = await db.select().from(cravingSessions).where(eq(cravingSessions.userId, userId));
  const managed = cravings.filter((c) => c.outcome === "eased" || c.outcome === "somewhat").length;
  const logs = await db.select().from(dailyLogs).where(eq(dailyLogs.userId, userId));
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const streak = smokeFreeStreak(
    logs.map((l) => ({
      logDate: l.logDate,
      smokeFree: l.smokeFree,
      lapse: l.lapse,
      amountSpent: l.amountSpent,
      quantityUsed: l.quantityUsed,
    })),
    profile?.quitDate ?? null,
  );
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  let percent = 0;
  if (ebook) {
    const [rp] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.ebookId, ebook.id)))
      .limit(1);
    percent = rp?.percent ?? 0;
  }
  const candidates: string[] = [];
  if (profile?.onboardingComplete) candidates.push("first_step");
  if (managed >= 5) candidates.push("novice_deflector");
  if (streak >= 7) candidates.push("habit_breaker");
  if (percent >= 50) candidates.push("steady_reader");
  if (products.length > 0) candidates.push("profile_ready");

  const existing = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
  const have = new Set(existing.map((e) => e.achievementId));
  for (const id of candidates) {
    if (!have.has(id)) {
      await db.insert(userAchievements).values({ userId, achievementId: id }).onConflictDoNothing();
    }
  }
}

export async function ensureMissions(userId: string) {
  const allMissions = await db.select().from(userMissions).where(eq(userMissions.userId, userId));
  const existing = allMissions.filter((m) => m.status === "active");
  if (existing.length >= 3) return allMissions;
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentCravings = await db
    .select()
    .from(cravingSessions)
    .where(and(eq(cravingSessions.userId, userId), gte(cravingSessions.createdAt, new Date(weekAgo))));
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  let percent = 0;
  if (ebook) {
    const [rp] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.ebookId, ebook.id)))
      .limit(1);
    percent = rp?.percent ?? 0;
  }
  const ideas: { missionKey: string; title: string; description: string }[] = [];
  if (!profile?.onboardingComplete) {
    ideas.push({
      missionKey: "finish_onboarding",
      title: "Finish your tobacco profile",
      description: "Answer the remaining questions so savings and missions can use your real numbers.",
    });
  }
  if (percent < 100) {
    ideas.push({
      missionKey: "continue_reading",
      title: "Continue reading The CounterPuff Method",
      description: "Open the eBook and pick up from your last page. Progress is saved to your account.",
    });
  }
  if (recentCravings.length === 0) {
    ideas.push({
      missionKey: "log_craving",
      title: "Record a craving before deciding",
      description: "The next time an urge appears, open Craving SOS and log it — even a short note helps.",
    });
  }
  ideas.push({
    missionKey: "breathing",
    title: "Try a guided breathing exercise",
    description: "Use the four-count box pattern for a few minutes when a trigger window approaches.",
  });
  ideas.push({
    missionKey: "review_week",
    title: "Review this week's progress",
    description: "Look at savings, cravings handled, and what you want to try differently. No self-punishment.",
  });
  const haveKeys = new Set(allMissions.map((m) => m.missionKey));
  let activeCount = existing.length;
  for (const idea of ideas) {
    if (activeCount >= 3) break;
    if (haveKeys.has(idea.missionKey)) continue;
    await db.insert(userMissions).values({ userId, ...idea, status: "active" });
    haveKeys.add(idea.missionKey);
    activeCount += 1;
  }
  return db.select().from(userMissions).where(eq(userMissions.userId, userId));
}
