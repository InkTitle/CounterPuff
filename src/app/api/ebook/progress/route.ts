import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ebookVersions, readingProgress } from "@/db/schema";
import { hasEbookEntitlement, isFeatureOn, jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { awardIfNeeded } from "@/lib/progress";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  page: z.number().int().min(1).max(5000),
  percent: z.number().min(0).max(100),
});

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  if (!ebook) return jsonOk({ ebook: null, progress: null });
  const [progress] = await db
    .select()
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, auth.user.id), eq(readingProgress.ebookId, ebook.id)))
    .limit(1);
  return jsonOk({ ebook, progress: progress ?? null });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("ebook", auth.user.id))) return jsonError("eBook access is disabled.", 403);
  if (!(await hasEbookEntitlement(auth.user.id))) return jsonError("No eBook entitlement.", 403);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid progress.", 400);
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  if (!ebook) return jsonError("No active eBook.", 404);
  await db
    .insert(readingProgress)
    .values({
      userId: auth.user.id,
      ebookId: ebook.id,
      lastPage: parsed.data.page,
      percent: parsed.data.percent,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.ebookId],
      set: { lastPage: parsed.data.page, percent: parsed.data.percent, updatedAt: new Date() },
    });
  await awardIfNeeded(auth.user.id);
  return jsonOk();
}
