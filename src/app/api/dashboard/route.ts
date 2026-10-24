import { jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { computeDashboard, ensureMissions } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  await ensureMissions(auth.user.id);
  const url = new URL(req.url);
  const filter = (url.searchParams.get("filter") as "daily" | "weekly" | "monthly" | "yearly") || "weekly";
  const data = await computeDashboard(auth.user, filter);
  return jsonOk({
    welcome: `Welcome back, ${auth.user.fullName}.`,
    user: auth.user,
    profile: data.profile,
    products: data.products,
    triggers: data.triggers,
    plan: data.plan,
    savings: data.savings,
    allTime: data.allTime,
    streak: data.streak,
    cravingsCount: data.cravingsCount,
    managed: data.managed,
    recentCravings: data.recentCravings,
    ebook: data.ebook,
    reading: data.reading,
    earned: data.earned,
    missions: data.missions,
    env: data.env,
    dailySpend: data.dailySpend,
    currency: auth.user.currency,
    track: data.track,
    quitDate: data.quitDate,
  });
}
