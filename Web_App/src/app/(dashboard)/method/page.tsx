import Link from "next/link";
import { redirect } from "next/navigation";
import { METHOD_STEPS } from "@/lib/constants";
import { PageHeader } from "@/components/ui";
import { MissionsPanel } from "@/components/missions-panel";
import { getCurrentUser } from "@/lib/auth";
import { computeDashboard, ensureMissions } from "@/lib/progress";
import { productLabel } from "@/lib/calculations";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Method" };

export default async function MethodPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureMissions(user.id);
  const data = await computeDashboard(user);
  return (
    <div>
      <PageHeader
        title="My Method"
        description="Notice → Deconstruct → Choose → Respond → Review. These steps come from the public cover of The CounterPuff Method. Chapter text is only in the authorized PDF."
      />
      <div className="grid gap-4 sm:grid-cols-5">
        {METHOD_STEPS.map((s) => (
          <article key={s.key} className="card p-4">
            <div className="mb-2 h-8 w-8 rounded-full" style={{ background: s.color }} />
            <h2 className="font-semibold">{s.title}</h2>
            <p className="text-sm text-[var(--muted)]">{s.summary}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold">Your track</h2>
          <p className="mt-2">
            <strong>{data.track.track}</strong>
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">{data.track.explanation}</p>
          <p className="mt-3 text-sm">
            Plan: {data.plan?.planType ?? "not set"} {data.quitDate ? `· ${data.quitDate}` : ""}
          </p>
          <ul className="mt-3 text-sm">
            {data.products.map((p) => (
              <li key={p.id}>{productLabel(p.productType)}</li>
            ))}
          </ul>
          <Link href="/onboarding" className="btn btn-ghost mt-4">
            Edit profile answers
          </Link>
        </article>
        <MissionsPanel missions={data.missions} />
      </div>
    </div>
  );
}
