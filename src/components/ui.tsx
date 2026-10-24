import type { ReactNode } from "react";

export function LogoMark({ className = "h-10" }: { className?: string }) {
  return (
    <img src="/images/logo.png" alt="CounterPuff" className={className} />
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-baseline gap-0 font-semibold tracking-tight ${light ? "text-white" : "text-[var(--navy)]"}`}>
      <span>Counter</span>
      <span className={light ? "text-[#7ee0c9]" : "text-[#2fa36b]"}>Puff</span>
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{eyebrow}</p> : null}
        <h1 className="font-serif text-3xl text-[var(--navy)] sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-[var(--muted)]">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">{value}</p>
      {hint ? <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p> : null}
    </article>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card p-8 text-center">
      <h2 className="text-xl font-semibold text-[var(--navy)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-[var(--muted)]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="disclaimer rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3">{children}</p>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm font-medium text-red-600">
      {children}
    </p>
  );
}

export function HealthDisclaimer() {
  return (
    <Notice>
      CounterPuff offers educational and behavioral support. It is not medical care, a diagnosis of nicotine
      dependence, or an emergency service. If you have chest pain, trouble breathing, or another urgent health
      concern, contact local emergency services. Consider a qualified clinician or a reputable quitline for
      additional support.
    </Notice>
  );
}
