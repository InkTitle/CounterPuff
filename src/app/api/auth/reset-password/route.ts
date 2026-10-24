import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, sessions, users } from "@/db/schema";
import { hashPassword, hashToken, jsonError, jsonOk } from "@/lib/auth";
import { resetSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return jsonError("Check the password requirements and try again.", 400);

  const tokenHash = hashToken(parsed.data.token);
  const [row] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, tokenHash), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  if (!row) return jsonError("This reset link is invalid or has expired.", 400);

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, row.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, row.id));
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, row.userId));
  return jsonOk({ message: "Password updated. You can sign in now." });
}
