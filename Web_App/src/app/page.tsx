import { AuthModalProvider, SignInButton, SignUpButton } from "@/components/auth-modal";
import { HealthDisclaimer, Wordmark } from "@/components/ui";
import { METHOD_STEPS } from "@/lib/constants";
import Link from "next/link";
import {
  BookOpen,
  Download,
  HeartPulse,
  LifeBuoy,
  LineChart,
  Lock,
  NotebookPen,
  Smartphone,
  Users,
  Wallet,
} from "lucide-react";

const EBOOK_BENEFITS = [
  {
    icon: BookOpen,
    title: "The method, in order",
    body: "Read The CounterPuff Method as a guided path: Notice, Deconstruct, Choose, Respond, and Review—without shame or scare tactics.",
  },
  {
    icon: NotebookPen,
    title: "Worksheets you can actually use",
    body: "Turn each chapter into a short, personal plan. Capture triggers, next actions, and what you learned after a hard moment.",
  },
  {
    icon: Download,
    title: "Read in the app or offline",
    body: "Open the authorized eBook in the built-in reader, resume from your last page, or download your copy when you need it offline.",
  },
];

const APP_BENEFITS = [
  {
    icon: LifeBuoy,
    title: "A plan when the urge hits",
    body: "Craving SOS is ready in the moment: a three-minute focus game, pattern-interrupt questions, guided breathing, and calm messages.",
  },
  {
    icon: Wallet,
    title: "Progress you can see",
    body: "Track products, estimated spending avoided, smoke-free days, and environmental estimates from your own numbers—not fake counters.",
  },
  {
    icon: Users,
    title: "Support without the noise",
    body: "A private, moderated community, reminders for difficult windows, and an account that stays yours. This is practice, not a test.",
  },
];

export default function LandingPage() {
  return (
    <AuthModalProvider>
      <main className="min-h-screen">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Wordmark />
          <div className="flex gap-2">
            <SignInButton />
            <SignUpButton />
          </div>
        </header>

        <section className="mx-auto max-w-4xl px-5 pb-6 pt-8 text-center sm:pt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Accompanying The CounterPuff Method
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-[var(--navy)] sm:text-6xl">
            Break the Craving Loop.
            <br />
            Build a Life Beyond Tobacco.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[var(--muted)]">
            Quitting is not a test of whether you are weak or strong. It is a skill you can practice—one craving, one
            choice, and one day at a time. Accompanying <em>The CounterPuff Method</em> by Warren Lockhart, this
            interactive app gives you an immediate plan every time an urge arrives.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <SignUpButton className="btn btn-green">Create an account</SignUpButton>
            <SignInButton className="btn btn-ghost" />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:grid-cols-5">
          {METHOD_STEPS.map((s) => (
            <article key={s.key} className="card p-4 text-left">
              <div className="mb-3 h-10 w-10 rounded-full" style={{ background: s.color }} />
              <h2 className="font-semibold text-[var(--navy)]">{s.title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{s.summary}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-6">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Why use both
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl text-[var(--navy)] sm:text-4xl">
            The eBook teaches the method. The web app helps you live it.
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-[var(--muted)]">
            Reading builds understanding. The companion app turns that understanding into a next step while a craving is
            still in the room.
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f6ee] text-[var(--green)]">
                  <BookOpen size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">The eBook</p>
                  <h3 className="text-2xl font-semibold text-[var(--navy)]">The CounterPuff Method</h3>
                </div>
              </div>
              <p className="mt-4 text-[var(--muted)]">
                A practical, evidence-informed guide to understanding urges, changing routines, and building a quit
                plan—at your pace, on a preparation track or an immediate quit date you choose.
              </p>
              <ul className="mt-5 space-y-4">
                {EBOOK_BENEFITS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <item.icon className="mt-0.5 shrink-0 text-[var(--green)]" size={20} />
                    <div>
                      <p className="font-semibold text-[var(--navy)]">{item.title}</p>
                      <p className="text-sm text-[var(--muted)]">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>

            <article className="card p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e7f3fb] text-[var(--navy)]">
                  <Smartphone size={22} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">The web app</p>
                  <h3 className="text-2xl font-semibold text-[var(--navy)]">CounterPuff companion</h3>
                </div>
              </div>
              <p className="mt-4 text-[var(--muted)]">
                Your private workspace for the minutes that decide the day: SOS tools, honest logging, and progress that
                comes from your records.
              </p>
              <ul className="mt-5 space-y-4">
                {APP_BENEFITS.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <item.icon className="mt-0.5 shrink-0 text-[#2b7c9a]" size={20} />
                    <div>
                      <p className="font-semibold text-[var(--navy)]">{item.title}</p>
                      <p className="text-sm text-[var(--muted)]">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-5 py-10 sm:grid-cols-3">
          <article className="card p-5">
            <HeartPulse className="text-[var(--coral)]" />
            <h3 className="mt-3 font-semibold text-[var(--navy)]">Educational, not clinical</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Health timelines are labeled educational benchmarks. CounterPuff does not diagnose, prescribe, or replace
              a clinician or emergency care.
            </p>
          </article>
          <article className="card p-5">
            <LineChart className="text-[var(--amber)]" />
            <h3 className="mt-3 font-semibold text-[var(--navy)]">Numbers from your data</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Savings and streaks use the products, prices, and daily logs you enter. A lapse does not erase earlier
              achievements.
            </p>
          </article>
          <article className="card p-5">
            <Lock className="text-[var(--navy)]" />
            <h3 className="mt-3 font-semibold text-[var(--navy)]">Private by design</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Accounts start pending approval. Your dashboard, eBook access, and craving history stay on your account.
            </p>
          </article>
        </section>

        <section className="mx-auto max-w-4xl px-5 pb-16 text-center">
          <div className="card p-8 sm:p-10">
            <h2 className="font-serif text-3xl text-[var(--navy)]">Start with the next craving, not the whole future.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--muted)]">
              Create an account, wait for activation, then keep the eBook and Craving SOS in one place—so you have
              something to do besides negotiate with the urge.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <SignUpButton className="btn btn-primary">Sign Up</SignUpButton>
              <SignInButton />
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-6xl space-y-4 px-5 pb-10">
          <HealthDisclaimer />
          <p className="text-sm text-[var(--muted)]">
            <Link href="/privacy" className="underline">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="underline">
              Terms
            </Link>{" "}
            · Support: writetoinktitle@gmail.com
          </p>
        </footer>
      </main>
    </AuthModalProvider>
  );
}
