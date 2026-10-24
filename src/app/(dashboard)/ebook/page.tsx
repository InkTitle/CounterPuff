import { redirect } from "next/navigation";
import { EbookReader } from "@/components/ebook-reader";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser, hasEbookEntitlement, isFeatureOn } from "@/lib/auth";
import { computeDashboard } from "@/lib/progress";

export const dynamic = "force-dynamic";
export const metadata = { title: "My eBook" };

export default async function EbookPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isFeatureOn("ebook", user.id))) {
    return <EmptyState title="eBook unavailable" body="This feature is currently disabled for your account." />;
  }
  if (!(await hasEbookEntitlement(user.id))) {
    return <EmptyState title="No eBook access" body="Your entitlement is not active. Contact support if you have already purchased the book." />;
  }
  const data = await computeDashboard(user);
  return (
    <div>
      <PageHeader
        title="The CounterPuff Method"
        description="Warren Lockhart · How to Systematically Deconstruct and Destroy Tobacco Cravings."
      />
      <div className="mb-6 grid gap-4 lg:grid-cols-[220px_1fr] items-start">
        <img src="/images/book-cover.png" alt="Original CounterPuff Method cover" className="rounded-2xl shadow" />
        <div className="card p-5">
          <p>
            Reading progress is stored on your account
            {data.reading ? ` · last page ${data.reading.lastPage} · ${Math.round(data.reading.percent)}%` : " · not started yet"}.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Downloads are logged for abuse prevention (time, IP, browser). The authorized PDF is served only after a
            server-side entitlement check.
          </p>
        </div>
      </div>
      {data.ebook ? (
        <EbookReader lastPage={data.reading?.lastPage ?? 1} pageCount={data.ebook.pageCount} />
      ) : (
        <EmptyState
          title="eBook file not published yet"
          body="The original manuscript file was not included in this deployment. An administrator can upload Final_TCPM.pdf from the content screen. The reader and download buttons activate after that upload."
        />
      )}
    </div>
  );
}
