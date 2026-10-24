import { ResetForm } from "@/components/auth-forms";
import { Wordmark } from "@/components/ui";

export const metadata = { title: "Choose a new password" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <section className="card w-full max-w-md p-8">
        <Wordmark />
        <h1 className="mt-4 font-serif text-3xl text-[var(--navy)]">Choose a new password</h1>
        {token ? (
          <div className="mt-6">
            <ResetForm token={token} />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">This reset link is missing or incomplete.</p>
        )}
      </section>
    </main>
  );
}
