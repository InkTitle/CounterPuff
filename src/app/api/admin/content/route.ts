import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { desc, eq } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import { db } from "@/db";
import { auditLogs, downloadRecords, ebookVersions } from "@/db/schema";
import { jsonError, jsonOk, requestMeta, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const versions = await db.select().from(ebookVersions).orderBy(desc(ebookVersions.createdAt));
  const downloads = await db.select().from(downloadRecords).orderBy(desc(downloadRecords.createdAt)).limit(50);
  return jsonOk({
    versions,
    downloads,
    note: "Replace the authorized PDF from this screen. Original manuscript file Final_TCPM.pdf was not present in the build package; administrators can upload it here.",
  });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.user) return jsonError(auth.error, auth.status);
  const form = await req.formData();
  const file = form.get("file");
  const version = String(form.get("version") ?? "1.0");
  if (!(file instanceof File)) return jsonError("Choose a PDF file.", 400);
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return jsonError("Only PDF files are accepted.", 400);
  }
  if (file.size > 40 * 1024 * 1024) return jsonError("File is too large.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let pageCount: number | null = null;
  try {
    const pdf = await PDFDocument.load(bytes);
    pageCount = pdf.getPageCount();
  } catch {
    return jsonError("Could not parse this PDF.", 400);
  }
  const dir = path.join(/* turbopackIgnore: true */ process.cwd(), "private", "ebooks");
  await mkdir(dir, { recursive: true });
  const filename = `counterpuff-method-${Date.now()}.pdf`;
  const dest = path.join(dir, filename);
  await writeFile(dest, bytes);
  await db.update(ebookVersions).set({ isActive: false });
  const [row] = await db
    .insert(ebookVersions)
    .values({
      title: "The CounterPuff Method",
      version,
      filePath: `private/ebooks/${filename}`,
      pageCount,
      isActive: true,
      uploadedBy: auth.user.id,
    })
    .returning();
  const meta = await requestMeta();
  await db.insert(auditLogs).values({
    actorId: auth.user.id,
    action: "ebook_upload",
    entityType: "ebook",
    entityId: row.id,
    details: { version, pageCount },
    ip: meta.ip,
  });
  return jsonOk({ ebook: row });
}
