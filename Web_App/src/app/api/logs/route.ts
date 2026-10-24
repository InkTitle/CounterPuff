import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyLogs } from "@/db/schema";
import { jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { awardIfNeeded } from "@/lib/progress";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  logDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  smokeFree: z.boolean(),
  lapse: z.boolean().optional(),
  quantityUsed: z.number().min(0).nullable().optional(),
  amountSpent: z.number().min(0).nullable().optional(),
  productType: z.string().max(64).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  familyActivityMinutes: z.number().int().min(0).max(1440).nullable().optional(),
});

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const rows = await db.select().from(dailyLogs).where(eq(dailyLogs.userId, auth.user.id)).orderBy(desc(dailyLogs.logDate));
  return jsonOk({ logs: rows });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Check the log fields.", 400);
  const lapse = parsed.data.lapse ?? !parsed.data.smokeFree;
  const [row] = await db
    .insert(dailyLogs)
    .values({
      userId: auth.user.id,
      logDate: parsed.data.logDate,
      smokeFree: parsed.data.smokeFree && !lapse,
      lapse,
      quantityUsed: parsed.data.quantityUsed ?? null,
      amountSpent: parsed.data.amountSpent ?? null,
      productType: parsed.data.productType ?? "all",
      notes: parsed.data.notes ?? null,
      familyActivityMinutes: parsed.data.familyActivityMinutes ?? null,
    })
    .onConflictDoUpdate({
      target: [dailyLogs.userId, dailyLogs.logDate, dailyLogs.productType],
      set: {
        smokeFree: parsed.data.smokeFree && !lapse,
        lapse,
        quantityUsed: parsed.data.quantityUsed ?? null,
        amountSpent: parsed.data.amountSpent ?? null,
        notes: parsed.data.notes ?? null,
        familyActivityMinutes: parsed.data.familyActivityMinutes ?? null,
      },
    })
    .returning();
  await awardIfNeeded(auth.user.id);
  return jsonOk({ log: row });
}
