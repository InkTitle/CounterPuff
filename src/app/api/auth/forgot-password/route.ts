import { eq } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { hashToken, jsonOk, newToken, normalizeEmail, requestMeta } from "@/lib/auth";
import { passwordResetEmail, sendEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { forgotSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const meta = await requestMeta();
  const rl = rateLimit(clientKey(meta.ip, "forgot"), 6, 15 * 60 * 1000);
  if (!rl.ok) {
    return Response.json({ ok: true, message: "If an account exists, reset instructions will be prepared." });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: true });
  }
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return jsonOk({ message: "If an account exists, reset instructions will be prepared." });

  const email = normalizeEmail(parsed.data.email);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = newToken();
    await db.insert(passwordResets).values({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const base = process.env.APP_URL || "http://localhost:3000";
    const resetUrl = `${base}/reset-password?token=${token}`;
    const mail = passwordResetEmail(user.fullName, resetUrl);
    const result = await sendEmail({
      to: user.email,
      subject: mail.subject,
      text: mail.text,
      meta: { type: "password_reset", userId: user.id },
    });
    return jsonOk({
      message: result.sent
        ? "If an account exists, a reset link was sent."
        : `If an account exists, a reset was created. Email was not sent: ${result.reason}`,
      emailSent: result.sent,
    });
  }
  return jsonOk({ message: "If an account exists, reset instructions will be prepared.", emailSent: false });
}
