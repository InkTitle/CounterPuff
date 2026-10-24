import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics & audit" };

export default async function AnalyticsPage() {
  const usage = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM users WHERE last_login_at > NOW() - INTERVAL '1 day')::int AS dau,
      (SELECT COUNT(*) FROM craving_sessions WHERE created_at > NOW() - INTERVAL '7 day')::int AS sos_week,
      (SELECT COUNT(*) FROM community_posts WHERE created_at > NOW() - INTERVAL '7 day')::int AS posts_week,
      (SELECT COUNT(*) FROM download_records WHERE created_at > NOW() - INTERVAL '7 day')::int AS dl_week,
      (SELECT COUNT(*) FROM reading_progress)::int AS readers
  `);
  const row = (usage.rows[0] ?? {}) as Record<string, number>;
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40);
  return (
    <div>
      <PageHeader title="Analytics & audit" description="Aggregated usage only. Individual passwords and secrets are never logged." />
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="card p-4"><p className="text-xs uppercase">DAU</p><p className="text-2xl">{row.dau ?? 0}</p></div>
        <div className="card p-4"><p className="text-xs uppercase">SOS (7d)</p><p className="text-2xl">{row.sos_week ?? 0}</p></div>
        <div className="card p-4"><p className="text-xs uppercase">Posts (7d)</p><p className="text-2xl">{row.posts_week ?? 0}</p></div>
        <div className="card p-4"><p className="text-xs uppercase">Downloads (7d)</p><p className="text-2xl">{row.dl_week ?? 0}</p></div>
        <div className="card p-4"><p className="text-xs uppercase">Readers</p><p className="text-2xl">{row.readers ?? 0}</p></div>
      </div>
      <article className="card mt-6 overflow-auto p-5">
        <h2 className="font-semibold">Audit log</h2>
        <table className="mt-3 w-full text-left text-sm">
          <thead>
            <tr>
              <th className="py-2">When</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="py-2">{l.createdAt.toISOString()}</td>
                <td>{l.action}</td>
                <td>
                  {l.entityType} {l.entityId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
