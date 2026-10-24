import Link from "next/link";
import { redirect } from "next/navigation";
import { HealthDisclaimer, PageHeader, StatCard } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatMoney, productLabel } from "@/lib/calculations";
import { computeDashboard, ensureMissions } from "@/lib/progress";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureMissions(user.id);
  const data = await computeDashboard(user, "weekly");
  if (!data.profile?.onboardingComplete) {
    redirect("/onboarding");
  }
  const nextMission = data.missions.find((m) => m.status === "active");
  return (
    <div>
      <PageHeader
        eyebrow="Daily overview"
        title={`Welcome back, ${user.fullName}.`}
        description="Your numbers come from the products, logs, and SOS sessions stored on your account."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/ebook" className="btn btn-primary">
              Continue reading
            </Link>
            <Link href="/progress" className="btn btn-ghost">
              Log a craving day
            </Link>
            <Link href="/sos" className="btn btn-coral sos-pulse">
              Open Craving SOS
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Plan"
          value={data.plan?.planType === "immediate" ? "Immediate quit" : data.plan?.planType === "preparation" ? "Preparation" : "Not set"}
          hint={data.quitDate ? `Target / quit date ${data.quitDate}` : "Add a date in My Method"}
        />
        <StatCard
          label="Estimated savings (this view)"
          value={formatMoney(data.savings.saved, user.currency)}
          hint={data.savings.estimated ? "Includes estimated costs" : "Based on recorded pack prices"}
        />
        <StatCard label="Smoke-free streak" value={`${data.streak} day${data.streak === 1 ? "" : "s"}`} hint="Lapses do not delete older achievements" />
        <StatCard
          label="eBook"
          value={data.reading ? `${Math.round(data.reading.percent)}%` : "Not started"}
          hint={data.reading ? `Last page ${data.reading.lastPage}` : "Open My eBook to begin"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-[var(--navy)]">Products currently tracked</h2>
          {data.products.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No products yet. Update them in onboarding or Account.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {data.products.map((p) => (
                <li key={p.id}>
                  {productLabel(p.productType)}
                  {p.quantityPerDay != null ? ` · ${p.quantityPerDay}/day` : ""}
                  {p.isEstimate ? " · estimate" : ""}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm text-[var(--muted)]">
            Typical daily spend (formula): {formatMoney(data.dailySpend, user.currency)}
          </p>
        </article>
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-[var(--navy)]">Next mission</h2>
          {nextMission ? (
            <div>
              <p className="mt-2 font-medium">{nextMission.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{nextMission.description}</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">No active missions. Check My Method.</p>
          )}
          <p className="mt-4 text-sm">
            Cravings logged: {data.cravingsCount} · managed (eased/somewhat): {data.managed}
          </p>
        </article>
      </div>

      {data.earned.length > 0 ? (
        <div className="mt-6 card p-5">
          <h2 className="text-lg font-semibold">Recent achievements</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {data.earned.map((e) => (
              <li key={e.achievement.id} className="rounded-full bg-[#eefbf0] px-3 py-1 text-sm">
                {e.achievement.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <HealthDisclaimer />
      </div>
    </div>
  );
}
