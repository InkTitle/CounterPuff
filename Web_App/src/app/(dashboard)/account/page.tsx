import { redirect } from "next/navigation";
import { AccountPanel } from "@/components/account-panel";
import { PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { reminderPreferences, supportTickets, userProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account & Support" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
  const [reminders] = await db.select().from(reminderPreferences).where(eq(reminderPreferences.userId, user.id)).limit(1);
  const tickets = await db.select().from(supportTickets).where(eq(supportTickets.userId, user.id)).orderBy(desc(supportTickets.createdAt));
  return (
    <div>
      <PageHeader
        title="Account & Support"
        description={`Account status: ${user.status}. Support email ${SUPPORT_EMAIL}.`}
      />
      {user.status !== "ACTIVE" ? (
        <p className="mb-4 rounded-2xl bg-amber-50 p-4">
          This account is {user.status}. Dashboard tools stay limited until an administrator restores access.
        </p>
      ) : null}
      <AccountPanel user={user} profile={profile ?? null} reminders={reminders ?? null} tickets={tickets} />
    </div>
  );
}
