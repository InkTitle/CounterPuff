import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, featureFlags } from "@/db/schema";
import { jsonError, jsonOk, requestMeta, requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const flags = await db.select().from(featureFlags);
  return jsonOk({ flags });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const parsed = z.object({ key: z.string(), enabled: z.boolean() }).safeParse(await req.json());
  if (!parsed.success) return jsonError("Invalid flag.", 400);
  await db.update(featureFlags).set({ enabled: parsed.data.enabled, updatedAt: new Date() }).where(eq(featureFlags.key, parsed.data.key));
  const meta = await requestMeta();
  await db.insert(auditLogs).values({
    actorId: auth.user.id,
    action: "feature_flag",
    entityType: "feature",
    entityId: parsed.data.key,
    details: parsed.data,
    ip: meta.ip,
  });
  return jsonOk();
}
