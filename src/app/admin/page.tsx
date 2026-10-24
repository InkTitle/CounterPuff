import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, reports, supportTickets, users } from "@/db/schema";
import { PageHeader, StatCard } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin overview" };

export default async function AdminHome() {
  const countsRes = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
      COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended,
      COUNT(*) FILTER (WHERE status = 'DEACTIVATED')::int AS deactivated
    FROM users
  `);
  const usageRes = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM craving_sessions)::int AS cravings,
      (SELECT COUNT(*) FROM community_posts)::int AS posts,
      (SELECT COUNT(*) FROM download_records)::int AS downloads,
      (SELECT COUNT(*) FROM reading_progress)::int AS readers
  `);
  const counts = (countsRes.rows[0] ?? {}) as Record<string, number>;
  const usage = (usageRes.rows[0] ?? {}) as Record<string, number>;
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(8);
  const openReports = await db.select().from(reports).where(eq(reports.status, "open"));
  const openTickets = await db.select().from(supportTickets).where(eq(supportTickets.status, "open"));
  const recentAudit = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8);

  return (
    <div>
      <PageHeader title="Operations overview" description="Live counts from the database. Passwords are never shown." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Registered" value={String(counts.total ?? 0)} />
        <StatCard label="Pending" value={String(counts.pending ?? 0)} />
        <StatCard label="Active" value={String(counts.active ?? 0)} />
        <StatCard label="Suspended" value={String(counts.suspended ?? 0)} />
        <StatCard label="Deactivated" value={String(counts.deactivated ?? 0)} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="SOS sessions" value={String(usage.cravings ?? 0)} />
        <StatCard label="Community posts" value={String(usage.posts ?? 0)} />
        <StatCard label="Downloads" value={String(usage.downloads ?? 0)} />
        <StatCard label="Readers" value={String(usage.readers ?? 0)} />
      </div>
      <p className="mt-4 text-sm text-[var(--muted)]">
        Payment verification is not connected. Entitlements stay separate from administrator activation until a provider
        is configured.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="font-semibold">Recent registrations</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recentUsers.map((u) => (
              <li key={u.id}>
                <a className="underline" href={`/admin/users`}>
                  {u.fullName}
                </a>{" "}
                · {u.email} · {u.status}
              </li>
            ))}
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="font-semibold">Workload and audit</h2>
          <p className="mt-2 text-sm">Open reports: {openReports.length}</p>
          <p className="text-sm">Open tickets: {openTickets.length}</p>
          <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
            {recentAudit.map((a) => (
              <li key={a.id}>
                {a.action} · {a.entityType} · {a.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
