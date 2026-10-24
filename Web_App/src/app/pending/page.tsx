import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Wordmark } from "@/components/ui";

export const metadata = { title: "Account pending" };

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (user?.status === "ACTIVE") redirect(user.role === "admin" ? "/admin" : "/home");
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card w-full max-w-lg p-8 text-center">
        <Wordmark />
        <h1 className="mt-6 font-serif text-3xl text-[var(--navy)]">Your Account is being Processed.</h1>
        <p className="mt-4 text-[var(--muted)]">
          {user ? `Thanks, ${user.fullName}. ` : null}
          An administrator must activate your account before full dashboard access becomes available. You can sign in
          again after approval.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)]">
          This is not an emergency service. If you need urgent medical help, contact local emergency services.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="btn btn-ghost">
            Home
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="btn btn-primary">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
