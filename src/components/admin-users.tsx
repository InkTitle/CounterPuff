"use client";

import { useEffect, useState } from "react";
import { ErrorText } from "./ui";

type Row = {
  id: string;
  email: string;
  fullName: string;
  status: string;
  role: string;
  country: string;
  createdAt: string;
};

export function AdminUsers() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function load() {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`);
    const data = await res.json();
    if (data.ok) setRows(data.users);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function open(id: string) {
    const res = await fetch(`/api/admin/users?id=${id}`);
    const data = await res.json();
    if (data.ok) setDetail(data);
  }

  async function changeStatus(userId: string, next: string) {
    if (reason.trim().length < 3) {
      setError("Record a reason of at least 3 characters.");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: next, reason }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setReason("");
    load();
    open(userId);
  }

  const user = detail?.user as { id: string; fullName: string; email: string; status: string; role: string } | undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <form
          className="mb-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="rounded-xl border px-3 py-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="">All statuses</option>
            <option value="PENDING_APPROVAL">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
          <button className="btn btn-primary" type="submit">
            Search
          </button>
        </form>
        <ErrorText>{error}</ErrorText>
        <div className="card overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3">Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-3">
                    <button type="button" className="underline" onClick={() => open(r.id)}>
                      {r.fullName}
                    </button>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.status}</td>
                  <td>{r.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="card p-5">
        {user ? (
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-semibold">{user.fullName}</h2>
            <p>ID: {user.id}</p>
            <p>{user.email}</p>
            <p>Status: {user.status}</p>
            <label className="field">
              Reason for status change
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-green py-1 text-sm" onClick={() => changeStatus(user.id, "ACTIVE")}>
                Activate
              </button>
              <button type="button" className="btn btn-ghost py-1 text-sm" onClick={() => changeStatus(user.id, "SUSPENDED")}>
                Suspend
              </button>
              <button type="button" className="btn btn-ghost py-1 text-sm" onClick={() => changeStatus(user.id, "DEACTIVATED")}>
                Deactivate
              </button>
            </div>
            <button
              type="button"
              className="btn btn-ghost py-1 text-sm"
              onClick={() =>
                fetch("/api/admin/users", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ revokeSessions: user.id }),
                })
              }
            >
              Revoke sessions
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">Select a user to manage access.</p>
        )}
      </aside>
    </div>
  );
}
