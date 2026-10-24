import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportMessages, supportTickets } from "@/db/schema";
import { getCurrentUser, isFeatureOn, jsonError, jsonOk, requestMeta } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { supportSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, user.id))
    .orderBy(desc(supportTickets.createdAt));
  return jsonOk({ tickets });
}

export async function POST(req: Request) {
  const meta = await requestMeta();
  const rl = rateLimit(clientKey(meta.ip, "support"), 8, 15 * 60 * 1000);
  if (!rl.ok) return jsonError("Please wait before sending another message.", 429);
  const user = await getCurrentUser();
  if (user && !(await isFeatureOn("support", user.id))) return jsonError("Support form is disabled.", 403);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const parsed = supportSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please complete all support fields.", 400);
  const [ticket] = await db
    .insert(supportTickets)
    .values({
      userId: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      body: parsed.data.body,
    })
    .returning();
  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    authorId: user?.id ?? null,
    authorRole: "user",
    body: parsed.data.body,
  });
  return jsonOk({ ticketId: ticket.id, message: "Your message was saved for the support team." });
}
