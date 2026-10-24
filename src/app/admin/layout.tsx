import { redirect } from "next/navigation";
import { AdminShell } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/home");
  return <AdminShell name={user.fullName}>{children}</AdminShell>;
}
