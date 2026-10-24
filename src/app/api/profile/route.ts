import { eq } from "drizzle-orm";
import { db } from "@/db";
import { reminderPreferences, userProfiles, users } from "@/db/schema";
import { jsonError, jsonOk, requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validations";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, auth.user.id)).limit(1);
  const [reminders] = await db.select().from(reminderPreferences).where(eq(reminderPreferences.userId, auth.user.id)).limit(1);
  return jsonOk({ user: auth.user, profile, reminders: reminders ?? null });
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (auth.user.status === "DEACTIVATED") return jsonError("Account deactivated.", 403);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please review your profile fields.", 400);

  const u = parsed.data;
  if (u.fullName || u.country || u.currency || u.place !== undefined || u.timezone) {
    await db
      .update(users)
      .set({
        ...(u.fullName ? { fullName: u.fullName } : {}),
        ...(u.country ? { country: u.country } : {}),
        ...(u.currency ? { currency: u.currency } : {}),
        ...(u.place !== undefined ? { place: u.place } : {}),
        ...(u.timezone ? { timezone: u.timezone } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.user.id));
  }
  await db
    .insert(userProfiles)
    .values({
      userId: auth.user.id,
      displayName: u.displayName ?? null,
      publicProfile: u.publicProfile ?? false,
      privacyShareProgress: u.privacyShareProgress ?? false,
      avatarUrl: u.avatarUrl ?? null,
      quitPlanType: u.quitPlanType,
      quitDate: u.quitDate,
    })
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        ...(u.displayName !== undefined ? { displayName: u.displayName } : {}),
        ...(u.publicProfile !== undefined ? { publicProfile: u.publicProfile } : {}),
        ...(u.privacyShareProgress !== undefined ? { privacyShareProgress: u.privacyShareProgress } : {}),
        ...(u.avatarUrl !== undefined ? { avatarUrl: u.avatarUrl } : {}),
        ...(u.quitPlanType ? { quitPlanType: u.quitPlanType } : {}),
        ...(u.quitDate !== undefined ? { quitDate: u.quitDate } : {}),
        updatedAt: new Date(),
      },
    });
  return jsonOk();
}

const passwordChange = z.object({
  currentPassword: z.string().min(1),
  password: z.string().min(10).max(128),
});

export async function PUT(req: Request) {
  const auth = await requireUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = passwordChange.safeParse(body);
  if (!parsed.success) return jsonError("Password must be at least 10 characters.", 400);
  const [user] = await db.select().from(users).where(eq(users.id, auth.user.id)).limit(1);
  if (!user) return jsonError("Account not found.", 404);
  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return jsonError("Current password is incorrect.", 400);
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() }).where(eq(users.id, auth.user.id));
  return jsonOk({ message: "Password updated." });
}
