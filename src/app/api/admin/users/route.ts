import { and, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import {
  accountStatusHistory,
  auditLogs,
  entitlements,
  sessions,
  userFeatureOverrides,
  userProfiles,
  users,
} from "@/db/schema";
import { jsonError, jsonOk, requestMeta, requireAdmin } from "@/lib/auth";
import { statusChangeSchema } from "@/lib/validations";
import { ACCOUNT_STATUSES } from "@/lib/constants";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const status = url.searchParams.get("status") ?? "";
  const id = url.searchParams.get("id");
  if (id) {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) return jsonError("User not found.", 404);
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, id)).limit(1);
    const history = await db.select().from(accountStatusHistory).where(eq(accountStatusHistory.userId, id)).orderBy(desc(accountStatusHistory.createdAt));
    const userSessions = await db.select().from(sessions).where(eq(sessions.userId, id)).orderBy(desc(sessions.createdAt)).limit(20);
    const ents = await db.select().from(entitlements).where(eq(entitlements.userId, id));
    const overrides = await db.select().from(userFeatureOverrides).where(eq(userFeatureOverrides.userId, id));
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return jsonOk({
      user: safeUser,
      profile,
      history,
      sessions: userSessions.map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        revokedAt: s.revokedAt,
        ip: s.ip,
        userAgent: s.userAgent,
      })),
      entitlements: ents,
      overrides,
    });
  }
  const filters = [];
  if (q) filters.push(or(ilike(users.email, `%${q}%`), ilike(users.fullName, `%${q}%`)));
  if (status && (ACCOUNT_STATUSES as readonly string[]).includes(status)) filters.push(eq(users.status, status));
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      status: users.status,
      role: users.role,
      country: users.country,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(200);
  return jsonOk({ users: rows });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const meta = await requestMeta();
  const body = await req.json();
  const parsed = statusChangeSchema.safeParse(body);
  if (parsed.success) {
    const [target] = await db.select().from(users).where(eq(users.id, parsed.data.userId)).limit(1);
    if (!target) return jsonError("User not found.", 404);
    if (target.role === "admin" && parsed.data.status !== "ACTIVE") {
      return jsonError("Administrator accounts cannot be suspended from this screen.", 400);
    }
    await db.update(users).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(users.id, target.id));
    await db.insert(accountStatusHistory).values({
      userId: target.id,
      fromStatus: target.status,
      toStatus: parsed.data.status,
      reason: parsed.data.reason,
      adminId: auth.user.id,
    });
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "status_change",
      entityType: "user",
      entityId: target.id,
      details: { from: target.status, to: parsed.data.status, reason: parsed.data.reason },
      ip: meta.ip,
    });
    if (parsed.data.status !== "ACTIVE") {
      await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, target.id));
    }
    return jsonOk({ message: `Account set to ${parsed.data.status}.` });
  }
  const feature = z
    .object({ userId: z.string().uuid(), featureKey: z.string(), enabled: z.boolean() })
    .safeParse(body);
  if (feature.success) {
    await db
      .insert(userFeatureOverrides)
      .values({ userId: feature.data.userId, featureKey: feature.data.featureKey, enabled: feature.data.enabled })
      .onConflictDoUpdate({
        target: [userFeatureOverrides.userId, userFeatureOverrides.featureKey],
        set: { enabled: feature.data.enabled },
      });
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "feature_override",
      entityType: "user",
      entityId: feature.data.userId,
      details: feature.data,
      ip: meta.ip,
    });
    return jsonOk();
  }
  const reset = z.object({ revokeSessions: z.string().uuid() }).safeParse(body);
  if (reset.success) {
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, reset.data.revokeSessions));
    await db.insert(auditLogs).values({
      actorId: auth.user.id,
      action: "revoke_sessions",
      entityType: "user",
      entityId: reset.data.revokeSessions,
      ip: meta.ip,
    });
    return jsonOk({ message: "Sessions revoked." });
  }
  return jsonError("Unrecognized admin action.", 400);
}
