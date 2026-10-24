"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ModerationPanel({
  reports,
  posts,
  tickets,
}: {
  reports: { id: string; reason: string; status: string; targetType: string; targetId: string }[];
  posts: { id: string; title: string; body: string; hidden: boolean }[];
  tickets: { id: string; subject: string; body: string; status: string; email: string }[];
}) {
  const router = useRouter();
  const [reason, setReason] = useState("Policy violation");
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <article className="card p-4">
        <h2 className="font-semibold">Reports</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border p-2">
              <p>
                {r.targetType} · {r.status}
              </p>
              <p>{r.reason}</p>
              <button
                type="button"
                className="btn btn-ghost mt-2 py-1 text-xs"
                onClick={async () => {
                  await fetch("/api/admin/moderation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reportId: r.id, status: "resolved" }),
                  });
                  router.refresh();
                }}
              >
                Resolve
              </button>
            </li>
          ))}
        </ul>
      </article>
      <article className="card p-4">
        <h2 className="font-semibold">Posts</h2>
        <label className="field my-2">
          Hide reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <ul className="space-y-3 text-sm">
          {posts.map((p) => (
            <li key={p.id} className="rounded-xl border p-2">
              <p className="font-medium">{p.title}</p>
              <p className="line-clamp-3">{p.body}</p>
              {p.hidden ? <p>Hidden</p> : (
                <button
                  type="button"
                  className="btn btn-ghost mt-2 py-1 text-xs"
                  onClick={async () => {
                    await fetch("/api/admin/moderation", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ hide: "post", id: p.id, reason }),
                    });
                    router.refresh();
                  }}
                >
                  Hide
                </button>
              )}
            </li>
          ))}
        </ul>
      </article>
      <article className="card p-4">
        <h2 className="font-semibold">Tickets</h2>
        <ul className="space-y-3 text-sm">
          {tickets.map((t) => (
            <li key={t.id} className="rounded-xl border p-2">
              <p className="font-medium">{t.subject}</p>
              <p>{t.email} · {t.status}</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await fetch("/api/admin/moderation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ticketId: t.id,
                      status: "closed",
                      reply: String(fd.get("reply")),
                    }),
                  });
                  router.refresh();
                }}
              >
                <textarea name="reply" required className="mt-2 w-full rounded-xl border p-2" />
                <button className="btn btn-primary mt-2 py-1 text-xs" type="submit">
                  Reply and close
                </button>
              </form>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
