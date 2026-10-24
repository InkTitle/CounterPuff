import Link from "next/link";

export const metadata = { title: "Privacy notice" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/" className="text-sm underline">
        Back
      </Link>
      <h1 className="mt-4 font-serif text-4xl text-[var(--navy)]">Privacy notice</h1>
      <div className="mt-6 space-y-4 text-[var(--muted)]">
        <p>
          CounterPuff stores the account information you provide (name, email, country, optional place, product usage,
          craving logs, reading progress, and community posts you choose to publish) so the app can personalize your
          workspace.
        </p>
        <p>
          Passwords are stored only as one-way hashes. Administrators cannot read your password. We do not silently
          collect GPS coordinates. Location is suggested from your browser locale and can be changed.
        </p>
        <p>
          Community content you post may be visible to other members. You control your display name and public profile
          flag. You can report or block other members.
        </p>
        <p>
          Email is sent only when an email provider is configured. Browser notifications are requested only if you enable
          them.
        </p>
        <p>
          To request export or deletion of your account data, contact writetoinktitle@gmail.com from the email on your
          account.
        </p>
      </div>
    </main>
  );
}
