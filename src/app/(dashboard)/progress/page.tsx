import { redirect } from "next/navigation";
import { HEALTH_TIMELINE } from "@/lib/constants";
import { formatMoney } from "@/lib/calculations";
import { HealthDisclaimer, PageHeader, StatCard } from "@/components/ui";
import { ProgressTools } from "@/components/progress-tools";
import { getCurrentUser } from "@/lib/auth";
import { computeDashboard } from "@/lib/progress";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Progress" };

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { filter: raw } = await searchParams;
  const filter = (["daily", "weekly", "monthly", "yearly"].includes(raw ?? "") ? raw : "weekly") as
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
  const data = await computeDashboard(user, filter);
  const smokeFreeDays = Math.max(0, data.allTime.daysCounted - data.allTime.daysWithLapse);
  return (
    <div>
      <PageHeader
        title="My Progress"
        description="Five reward categories, each using stored logs and the formulas shown on the cards. Nothing here auto-increments."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["daily", "weekly", "monthly", "yearly"] as const).map((f) => (
          <a key={f} href={`/progress?filter=${f}`} className={`btn ${filter === f ? "btn-primary" : "btn-ghost"}`}>
            {f}
          </a>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Financial"
          value={formatMoney(data.savings.saved, user.currency)}
          hint={`usual daily cost ${formatMoney(data.dailySpend, user.currency)} × smoke-free or reduced days in this range. Lapse days subtract recorded spend.`}
        />
        <StatCard label="Health / behavior" value={`${data.streak} day streak`} hint={`${data.managed} cravings marked eased or somewhat`} />
        <StatCard label="Social" value={`${data.cravingsCount} SOS sessions`} hint="Community badges appear when earned from real activity" />
        <StatCard
          label="Environmental (estimate)"
          value={`${data.env.cigaretteFiltersAvoided} filters`}
          hint={`≈ ${data.env.filterMassGrams} g filter mass avoided. See assumptions below.`}
        />
        <StatCard label="Family" value={`${smokeFreeDays} smoke-free days`} hint="Optional family activity minutes can be logged below." />
        <StatCard
          label="All-time estimated savings"
          value={formatMoney(data.allTime.saved, user.currency)}
          hint={data.quitDate ? `From ${data.quitDate}` : "Set a quit date to start this counter"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold">Educational recovery timeline</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            These are published educational benchmarks, not measurements of your body.
          </p>
          <ul className="mt-3 space-y-3 text-sm">
            {HEALTH_TIMELINE.map((h) => (
              <li key={h.after}>
                <strong>{h.after}:</strong> {h.text}
                <div className="text-xs text-[var(--muted)]">{h.source}</div>
              </li>
            ))}
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="text-lg font-semibold">Environmental assumptions</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]">
            {data.env.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {data.earned.length ? (
            <div className="mt-4">
              <h3 className="font-medium">Badges</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {data.earned.map((e) => (
                  <li key={e.achievement.id} className="rounded-full bg-[#eefbf0] px-3 py-1 text-sm">
                    {e.achievement.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-[var(--muted)]">No badges yet — they appear after real actions.</p>
          )}
        </article>
      </div>

      <ProgressTools currency={user.currency} />
      <div className="mt-6">
        <HealthDisclaimer />
      </div>
    </div>
  );
}
