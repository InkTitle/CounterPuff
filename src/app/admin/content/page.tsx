import { desc } from "drizzle-orm";
import { db } from "@/db";
import { downloadRecords, ebookVersions } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { ContentUpload } from "@/components/content-upload";

export const dynamic = "force-dynamic";
export const metadata = { title: "eBook & content" };

export default async function ContentPage() {
  const versions = await db.select().from(ebookVersions).orderBy(desc(ebookVersions.createdAt));
  const downloads = await db.select().from(downloadRecords).orderBy(desc(downloadRecords.createdAt)).limit(20);
  return (
    <div>
      <PageHeader
        title="eBook & content"
        description="Only administrators can publish the authorized PDF. The original Final_TCPM.pdf file was not in the build package; upload it here to replace the placeholder."
      />
      <ContentUpload />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="font-semibold">Versions</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {versions.map((v) => (
              <li key={v.id}>
                v{v.version} · {v.pageCount ?? "?"} pages · {v.isActive ? "active" : "inactive"} · {v.filePath}
              </li>
            ))}
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="font-semibold">Recent downloads</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {downloads.map((d) => (
              <li key={d.id}>
                {d.userId.slice(0, 8)}… · {d.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
