import { AdminUsers } from "@/components/admin-users";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users & access" };

export default function AdminUsersPage() {
  return (
    <div>
      <PageHeader title="Users & access" description="Approve, suspend, or restore accounts. Every sensitive change needs a reason and is written to the audit log." />
      <AdminUsers />
    </div>
  );
}
