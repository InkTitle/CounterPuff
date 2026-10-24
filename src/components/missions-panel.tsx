"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mission = {
  id: string;
  title: string;
  description: string;
  status: string;
};

export function MissionsPanel({ missions }: { missions: Mission[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function act(id: string, action: "complete" | "skip") {
    setBusy(id);
    await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    router.refresh();
  }
  return (
    <article className="card p-5">
      <h2 className="text-lg font-semibold">Personalized missions</h2>
      <ul className="mt-3 space-y-3">
        {missions.length === 0 ? <li className="text-sm text-[var(--muted)]">No missions yet.</li> : null}
        {missions.map((m) => (
          <li key={m.id} className="rounded-2xl border border-[var(--line)] p-3">
            <p className="font-medium">{m.title}</p>
            <p className="text-sm text-[var(--muted)]">{m.description}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">{m.status}</p>
            {m.status === "active" ? (
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn btn-green py-1 text-sm" disabled={busy === m.id} onClick={() => act(m.id, "complete")}>
                  Complete
                </button>
                <button type="button" className="btn btn-ghost py-1 text-sm" disabled={busy === m.id} onClick={() => act(m.id, "skip")}>
                  Skip
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </article>
  );
}
