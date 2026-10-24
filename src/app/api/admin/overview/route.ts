import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, reports, supportTickets, users } from "@/db/schema";
import { jsonError, jsonOk, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const countsRes = await db.execute(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'ACTIVE')::int AS active,
      COUNT(*) FILTER (WHERE status = 'SUSPENDED')::int AS suspended,
      COUNT(*) FILTER (WHERE status = 'DEACTIVATED')::int AS deactivated
    FROM users
  `);
  const counts = countsRes.rows[0];
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(8);
  const openReports = await db.select().from(reports).where(eq(reports.status, "open"));
  const openTickets = await db.select().from(supportTickets).where(eq(supportTickets.status, "open"));
  const recentAudit = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(12);
  const usageRes = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM craving_sessions)::int AS cravings,
      (SELECT COUNT(*) FROM community_posts)::int AS posts,
      (SELECT COUNT(*) FROM download_records)::int AS downloads,
      (SELECT COUNT(*) FROM reading_progress)::int AS readers
  `);
  const usage = usageRes.rows[0];
  return jsonOk({
    counts: counts as Record<string, number>,
    usage: usage as Record<string, number>,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      status: u.status,
      createdAt: u.createdAt,
    })),
    openReports: openReports.length,
    openTickets: openTickets.length,
    recentAudit,
    paymentNote:
      "Payment verification is not connected. Entitlements stay separate from administrator activation until a provider is configured.",
  });
}
