import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reminderPreferences } from "@/db/schema";
import { isFeatureOn, jsonError, jsonOk, requireActiveUser } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  enabled: z.boolean(),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().min(1).max(64),
  categories: z.array(z.string()).max(10),
  emailEnabled: z.boolean(),
  browserEnabled: z.boolean(),
  quietStart: z.string().nullable().optional(),
  quietEnd: z.string().nullable().optional(),
});

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const [row] = await db.select().from(reminderPreferences).where(eq(reminderPreferences.userId, auth.user.id)).limit(1);
  return jsonOk({
    reminders: row ?? null,
    delivery:
      process.env.SMTP_HOST
        ? "Email reminders can be sent when SMTP is configured. Exact-time delivery is not guaranteed."
        : "Email reminders are not sent until SMTP_HOST, SMTP_USER, and SMTP_PASS are configured. Browser notifications require your permission.",
  });
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("reminders", auth.user.id))) return jsonError("Reminders are disabled.", 403);
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Check reminder settings.", 400);
  await db
    .insert(reminderPreferences)
    .values({ userId: auth.user.id, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: reminderPreferences.userId,
      set: { ...parsed.data, updatedAt: new Date() },
    });
  return jsonOk({
    message: process.env.SMTP_HOST
      ? "Preferences saved. Email reminders will use your timezone when the mailer is running."
      : "Preferences saved. Email delivery is not configured yet, so no reminder emails will be sent.",
  });
}
