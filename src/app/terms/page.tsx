import Link from "next/link";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm underline">
        Back
      </Link>
      <h1 className="mt-4 font-serif text-4xl text-[var(--navy)]">Terms of use</h1>
      <div className="mt-6 space-y-4 text-[var(--muted)]">
        <p>
          CounterPuff is an educational behavioral-support companion to <em>The CounterPuff Method</em>. It is not a
          medical device, a diagnosis of nicotine dependence, or a substitute for professional healthcare.
        </p>
        <p>
          You are responsible for the information you enter. Savings, environmental, and health timeline figures are
          estimates or educational benchmarks unless you record actual measurements.
        </p>
        <p>
          Do not post medical dosing advice, harassment, spam, or threats in the community. Administrators may hide
          content and change account status for safety.
        </p>
        <p>Access to the eBook is limited to authorized accounts. Do not share download files publicly.</p>
      </div>
    </main>
  );
}
