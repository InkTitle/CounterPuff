import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userMissions } from "@/db/schema";
import { jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { ensureMissions } from "@/lib/progress";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const missions = await ensureMissions(auth.user.id);
  return jsonOk({ missions });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const parsed = z.object({ id: z.string().uuid(), action: z.enum(["complete", "skip"]) }).safeParse(await req.json());
  if (!parsed.success) return jsonError("Invalid mission update.", 400);
  const body = parsed.data;
  await db
    .update(userMissions)
    .set({
      status: body.action === "complete" ? "completed" : "skipped",
      completedAt: body.action === "complete" ? new Date() : null,
    })
    .where(and(eq(userMissions.id, body.id), eq(userMissions.userId, auth.user.id)));
  return jsonOk();
}
