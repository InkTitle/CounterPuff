import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  blocks,
  chatMessages,
  communityComments,
  communityPosts,
  reactions,
  reports,
  users,
} from "@/db/schema";
import { isFeatureOn, jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { commentSchema, postSchema } from "@/lib/validations";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("community", auth.user.id))) return jsonError("Community is disabled.", 403);
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") ?? "feed";
  const blocked = await db.select().from(blocks).where(eq(blocks.blockerId, auth.user.id));
  const blockedIds = new Set(blocked.map((b) => b.blockedId));

  if (kind === "chat") {
    const rows = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt)).limit(80);
    const visible = rows.filter((r) => !r.hidden && !blockedIds.has(r.userId)).reverse();
    return jsonOk({ messages: visible });
  }

  const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(50);
  const visiblePosts = posts.filter((p) => !p.hidden && !blockedIds.has(p.userId));
  const comments = await db.select().from(communityComments).orderBy(desc(communityComments.createdAt)).limit(200);
  const reacts = await db.select().from(reactions);
  const authors = await db.select({ id: users.id, fullName: users.fullName }).from(users);
  const nameBy = new Map(authors.map((a) => [a.id, a.fullName]));
  return jsonOk({
    posts: visiblePosts.map((p) => ({
      ...p,
      author: nameBy.get(p.userId) ?? "Member",
      comments: comments.filter((c) => c.postId === p.id && !c.hidden && !blockedIds.has(c.userId)).map((c) => ({
        ...c,
        author: nameBy.get(c.userId) ?? "Member",
      })),
      encouragements: reacts.filter((r) => r.targetType === "post" && r.targetId === p.id).length,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("community", auth.user.id))) return jsonError("Community is disabled.", 403);
  const meta = await requestMeta();
  const rl = rateLimit(clientKey(meta.ip, "community"), 20, 10 * 60 * 1000);
  if (!rl.ok) return jsonError("Please wait before posting more.", 429);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const asPost = postSchema.safeParse(body);
  if (asPost.success) {
    const [row] = await db
      .insert(communityPosts)
      .values({
        userId: auth.user.id,
        title: asPost.data.title,
        body: asPost.data.body,
        category: asPost.data.category,
        urgent: asPost.data.category === "urgent",
      })
      .returning();
    return jsonOk({ post: row });
  }
  const asComment = commentSchema.safeParse(body);
  if (asComment.success) {
    const [row] = await db
      .insert(communityComments)
      .values({
        postId: asComment.data.postId,
        userId: auth.user.id,
        body: asComment.data.body,
      })
      .returning();
    return jsonOk({ comment: row });
  }
  const chat = z.object({ chat: z.literal(true), body: z.string().trim().min(1).max(500) }).safeParse(body);
  if (chat.success) {
    const [row] = await db
      .insert(chatMessages)
      .values({ userId: auth.user.id, body: chat.data.body, room: "general" })
      .returning();
    return jsonOk({ message: row });
  }
  const react = z.object({ react: z.literal(true), targetId: z.string().uuid() }).safeParse(body);
  if (react.success) {
    await db
      .insert(reactions)
      .values({ userId: auth.user.id, targetType: "post", targetId: react.data.targetId, kind: "encourage" })
      .onConflictDoNothing();
    return jsonOk();
  }
  const report = z
    .object({ report: z.literal(true), targetType: z.enum(["post", "comment", "user"]), targetId: z.string().uuid(), reason: z.string().min(3).max(500) })
    .safeParse(body);
  if (report.success) {
    await db.insert(reports).values({
      reporterId: auth.user.id,
      targetType: report.data.targetType,
      targetId: report.data.targetId,
      reason: report.data.reason,
    });
    return jsonOk({ message: "Report received. Thank you." });
  }
  const block = z.object({ block: z.literal(true), blockedId: z.string().uuid() }).safeParse(body);
  if (block.success) {
    if (block.data.blockedId === auth.user.id) return jsonError("You cannot block yourself.", 400);
    await db.insert(blocks).values({ blockerId: auth.user.id, blockedId: block.data.blockedId }).onConflictDoNothing();
    return jsonOk();
  }
  return jsonError("Unrecognized community action.", 400);
}
