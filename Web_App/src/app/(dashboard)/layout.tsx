import { redirect } from "next/navigation";
import { AppShell } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "PENDING_APPROVAL") redirect("/pending");
  return (
    <AppShell name={user.fullName} isAdmin={user.role === "admin"} status={user.status}>
      {children}
    </AppShell>
  );
}
