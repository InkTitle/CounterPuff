import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountStatusHistory, entitlements, userProfiles, users } from "@/db/schema";
import { createSession, hashPassword, mapUser, normalizeEmail, requestMeta } from "@/lib/auth";
import { COUNTRIES } from "@/lib/constants";
import { registrationEmail, sendEmail } from "@/lib/email";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validations";
import { jsonError, jsonOk } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const meta = await requestMeta();
  const rl = rateLimit(clientKey(meta.ip, "signup"), 8, 15 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many registration attempts. Please wait and try again.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Please check the highlighted fields.", 400, {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  const data = parsed.data;
  const email = normalizeEmail(data.email);
  const country = COUNTRIES.find((c) => c.code === data.country);
  if (!country) return jsonError("Unknown country.", 400);

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return jsonError("If this email can be used, you will see the next step after signing in.", 400);
  }

  const passwordHash = await hashPassword(data.password);
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      fullName: data.fullName.trim(),
      country: data.country,
      place: data.place?.trim() || null,
      currency: data.currency || country.currency,
      role: "user",
      status: "PENDING_APPROVAL",
      timezone: data.timezone || "UTC",
      termsAcceptedAt: new Date(),
    })
    .returning();

  await db.insert(userProfiles).values({
    userId: user.id,
    displayName: data.fullName.trim().split(" ")[0],
  });
  await db.insert(accountStatusHistory).values({
    userId: user.id,
    fromStatus: null,
    toStatus: "PENDING_APPROVAL",
    reason: "Self-registration",
  });
  await db.insert(entitlements).values({
    userId: user.id,
    productKey: "app",
    status: "pending",
    source: "registration",
  });

  const mail = registrationEmail(user.fullName);
  const emailResult = await sendEmail({
    to: user.email,
    subject: mail.subject,
    text: mail.text,
    meta: { type: "registration", userId: user.id },
  });

  await createSession(mapUser(user), meta);
  return jsonOk({
    status: user.status,
    emailSent: emailResult.sent,
    emailNote: emailResult.sent
      ? "A confirmation email was sent."
      : `Account created. ${emailResult.reason ?? "Email was not sent."}`,
  });
}
