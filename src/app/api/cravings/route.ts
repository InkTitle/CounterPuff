import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { cravingSessions } from "@/db/schema";
import { isFeatureOn, jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { awardIfNeeded } from "@/lib/progress";
import { cravingSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const rows = await db
    .select()
    .from(cravingSessions)
    .where(eq(cravingSessions.userId, auth.user.id))
    .orderBy(desc(cravingSessions.createdAt));
  return jsonOk({ sessions: rows });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("sos", auth.user.id))) return jsonError("Craving SOS is currently unavailable.", 403);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = cravingSchema.safeParse(body);
  if (!parsed.success) return jsonError("Could not save this session.", 400);
  const [row] = await db
    .insert(cravingSessions)
    .values({
      userId: auth.user.id,
      toolUsed: parsed.data.toolUsed,
      durationSeconds: parsed.data.durationSeconds ?? null,
      answers: parsed.data.answers ?? null,
      outcome: parsed.data.outcome ?? null,
      endedAt: new Date(),
      synced: true,
    })
    .returning();
  await awardIfNeeded(auth.user.id);
  return jsonOk({ session: row });
}
