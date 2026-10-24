import { desc } from "drizzle-orm";
import { db } from "@/db";
import { communityPosts, reports, supportTickets } from "@/db/schema";
import { PageHeader } from "@/components/ui";
import { ModerationPanel } from "@/components/moderation-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community & support" };

export default async function AdminCommunityPage() {
  const openReports = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(50);
  const posts = await db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt)).limit(30);
  const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(30);
  return (
    <div>
      <PageHeader title="Community & support" description="Hide content, resolve reports, and reply to tickets. Reasons are stored." />
      <ModerationPanel reports={openReports} posts={posts} tickets={tickets} />
    </div>
  );
}
