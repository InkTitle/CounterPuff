import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  chatMessages,
  communityComments,
  communityPosts,
  moderationActions,
  reports,
  supportMessages,
  supportTickets,
} from "@/db/schema";
import { jsonError, jsonOk, requestMeta, requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const openReports = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(100);
  const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(50);
  const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(50);
  return jsonOk({ reports: openReports, posts, tickets });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const meta = await requestMeta();
  const body = await req.json();
  const hide = z
    .object({ hide: z.enum(["post", "comment", "chat"]), id: z.string().uuid(), reason: z.string().min(3) })
    .safeParse(body);
  if (hide.success) {
    if (hide.data.hide === "post") await db.update(communityPosts).set({ hidden: true }).where(eq(communityPosts.id, hide.data.id));
    if (hide.data.hide === "comment") await db.update(communityComments).set({ hidden: true }).where(eq(communityComments.id, hide.data.id));
    if (hide.data.hide === "chat") await db.update(chatMessages).set({ hidden: true }).where(eq(chatMessages.id, hide.data.id));
    await db.insert(moderationActions).values({
      adminId: auth.user.id,
      targetType: hide.data.hide,
      targetId: hide.data.id,
      action: "hide",
      reason: hide.data.reason,
    });
    return jsonOk();
  }
  const report = z.object({ reportId: z.string().uuid(), status: z.enum(["open", "resolved", "dismissed"]) }).safeParse(body);
  if (report.success) {
    await db.update(reports).set({ status: report.data.status }).where(eq(reports.id, report.data.reportId));
    return jsonOk();
  }
  const ticket = z
    .object({ ticketId: z.string().uuid(), status: z.enum(["open", "pending", "closed"]).optional(), reply: z.string().min(1).optional() })
    .safeParse(body);
  if (ticket.success) {
    if (ticket.data.status) {
      await db.update(supportTickets).set({ status: ticket.data.status, updatedAt: new Date() }).where(eq(supportTickets.id, ticket.data.ticketId));
    }
    if (ticket.data.reply) {
      await db.insert(supportMessages).values({
        ticketId: ticket.data.ticketId,
        authorId: auth.user.id,
        authorRole: "admin",
        body: ticket.data.reply,
      });
    }
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "support_update",
      entityType: "ticket",
      entityId: ticket.data.ticketId,
      ip: meta.ip,
    });
    return jsonOk();
  }
  return jsonError("Unrecognized moderation action.", 400);
}
