import { redirect } from "next/navigation";
import { CommunityBoard } from "@/components/community-board";
import { EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser, isFeatureOn } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community" };

export default async function CommunityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(await isFeatureOn("community", user.id))) {
    return <EmptyState title="Community unavailable" body="This feature is currently disabled." />;
  }
  return (
    <div>
      <PageHeader
        title="Community"
        description="Peer support is not medical advice. Report dangerous health claims, harassment, spam, or threats."
      />
      <CommunityBoard userId={user.id} />
    </div>
  );
}
