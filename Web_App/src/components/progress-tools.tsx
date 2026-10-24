"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText } from "./ui";

export function ProgressTools({ currency }: { currency: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const smokeFree = form.get("smokeFree") === "yes";
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logDate: String(form.get("logDate")),
        smokeFree,
        lapse: !smokeFree,
        quantityUsed: form.get("quantityUsed") ? Number(form.get("quantityUsed")) : null,
        amountSpent: form.get("amountSpent") ? Number(form.get("amountSpent")) : null,
        notes: String(form.get("notes") ?? "") || null,
        familyActivityMinutes: form.get("familyActivityMinutes") ? Number(form.get("familyActivityMinutes")) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save log.");
      return;
    }
    setError(null);
    setMessage("Day saved. Historical achievements are kept even if this day was a lapse.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
      <h2 className="sm:col-span-2 text-lg font-semibold">Log today honestly</h2>
      <label className="field">
        Date
        <input name="logDate" type="date" defaultValue={today} required />
      </label>
      <label className="field">
        How did the day go?
        <select name="smokeFree" defaultValue="yes">
          <option value="yes">Smoke-free / nicotine-free</option>
          <option value="no">I used tobacco or nicotine (lapse)</option>
        </select>
      </label>
      <label className="field">
        Quantity used (if any)
        <input name="quantityUsed" type="number" min={0} step="0.1" />
      </label>
      <label className="field">
        Amount spent ({currency})
        <input name="amountSpent" type="number" min={0} step="0.01" />
      </label>
      <label className="field">
        Family / household activity minutes (optional)
        <input name="familyActivityMinutes" type="number" min={0} />
      </label>
      <label className="field sm:col-span-2">
        Notes
        <textarea name="notes" rows={2} />
      </label>
      <div className="sm:col-span-2">
        <ErrorText>{error}</ErrorText>
        {message ? <p className="text-sm text-[var(--green)]">{message}</p> : null}
        <button className="btn btn-primary mt-2" type="submit">
          Save daily log
        </button>
      </div>
    </form>
  );
}
