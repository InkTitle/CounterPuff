import { ForgotForm } from "@/components/auth-forms";
import { Wordmark } from "@/components/ui";

export const metadata = { title: "Reset password" };

export default function ForgotPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card w-full max-w-md p-8">
        <Wordmark />
        <h1 className="mt-4 font-serif text-3xl text-[var(--navy)]">Reset password</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          If an account exists for that email, we will prepare a time-limited reset link. Email is only sent when SMTP
          is configured.
        </p>
        <div className="mt-6">
          <ForgotForm />
        </div>
      </section>
    </main>
  );
}
