import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { downloadRecords, ebookVersions } from "@/db/schema";
import { hasEbookEntitlement, isFeatureOn, jsonError, requestMeta, requireActiveUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("ebook", auth.user.id))) return jsonError("eBook access is disabled.", 403);
  if (!(await hasEbookEntitlement(auth.user.id))) return jsonError("No eBook entitlement.", 403);
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  if (!ebook) return jsonError("No active eBook has been published.", 404);
  const meta = await requestMeta();
  await db.insert(downloadRecords).values({
    userId: auth.user.id,
    ebookId: ebook.id,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  try {
    const filePath = path.join(process.cwd(), "private", "ebooks", path.basename(ebook.filePath));
    const buf = await readFile(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"The-CounterPuff-Method.pdf\"",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return jsonError("The eBook file is not available on this server yet.", 404);
  }
}
