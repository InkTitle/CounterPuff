import Link from "next/link";
import { SignUpForm } from "@/components/auth-forms";
import { Wordmark } from "@/components/ui";
import { AuthPageClose } from "@/components/auth-page-close";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card relative w-full max-w-lg p-8">
        <AuthPageClose />
        <Wordmark />
        <h1 className="mt-4 font-serif text-3xl text-[var(--navy)]">Create your account</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          After you register, an administrator must activate the account before the full dashboard opens.
        </p>
        <div className="mt-6">
          <SignUpForm />
        </div>
        <p className="mt-5 text-sm">
          Already registered?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
