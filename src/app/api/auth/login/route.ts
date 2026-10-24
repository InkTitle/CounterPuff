import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  createSession,
  jsonError,
  jsonOk,
  mapUser,
  normalizeEmail,
  requestMeta,
  verifyPassword,
} from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const meta = await requestMeta();
  const rl = rateLimit(clientKey(meta.ip, "login"), 12, 15 * 60 * 1000);
  if (!rl.ok) return jsonError("Too many sign-in attempts. Please wait a few minutes.", 429);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return jsonError("Enter a valid email and password.", 400);

  const email = normalizeEmail(parsed.data.email);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const dummy = "$2a$12$C6UzMDM.H6dfI/f/IKcEeOQhQ5n3kYhPqNqNqNqNqNqNqNqNqNqO";
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? dummy);
  if (!user || !ok) {
    return jsonError("Those details did not match our records.", 401);
  }
  if (user.status === "DEACTIVATED") {
    return jsonError("This account is deactivated. Contact support if you need help.", 403, { status: user.status });
  }

  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  await createSession(mapUser(user), meta);
  return jsonOk({
    status: user.status,
    role: user.role,
    name: user.fullName,
  });
}
