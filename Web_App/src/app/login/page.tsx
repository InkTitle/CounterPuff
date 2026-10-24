import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth-forms";
import { Wordmark } from "@/components/ui";
import { AuthPageClose } from "@/components/auth-page-close";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card relative w-full max-w-md p-8">
        <AuthPageClose />
        <Wordmark />
        <h1 className="mt-4 font-serif text-3xl text-[var(--navy)]">Sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Use the email and password for your CounterPuff account.</p>
        <div className="mt-6">
          <Suspense fallback={<p>Loading…</p>}>
            <SignInForm />
          </Suspense>
        </div>
        <p className="mt-5 text-sm">
          New here?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
