import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { ebookVersions } from "@/db/schema";
import { hasEbookEntitlement, isFeatureOn, jsonError, requireActiveUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireActiveUser();
  if (!auth.user) return jsonError(auth.error, auth.status);
  if (!(await isFeatureOn("ebook", auth.user.id))) return jsonError("eBook access is disabled.", 403);
  if (!(await hasEbookEntitlement(auth.user.id))) return jsonError("No eBook entitlement.", 403);
  const [ebook] = await db.select().from(ebookVersions).where(eq(ebookVersions.isActive, true)).limit(1);
  if (!ebook) return jsonError("No active eBook has been published.", 404);
  try {
    const filePath = path.join(process.cwd(), "private", "ebooks", path.basename(ebook.filePath));
    const buf = await readFile(filePath);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"The-CounterPuff-Method.pdf\"",
        "Cache-Control": "private, no-store",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch {
    return jsonError("The eBook file is not available on this server yet.", 404);
  }
}
