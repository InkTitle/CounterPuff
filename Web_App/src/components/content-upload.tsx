"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText } from "./ui";

export function ContentUpload() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/content", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setOk(`Published version ${data.ebook?.version} (${data.ebook?.pageCount} pages).`);
    router.refresh();
  }
  return (
    <form onSubmit={onSubmit} className="card grid max-w-lg gap-3 p-5">
      <label className="field">
        Version label
        <input name="version" defaultValue="1.0" required />
      </label>
      <label className="field">
        PDF file
        <input name="file" type="file" accept="application/pdf" required />
      </label>
      <ErrorText>{error}</ErrorText>
      {ok ? <p className="text-sm text-[var(--green)]">{ok}</p> : null}
      <button className="btn btn-primary" type="submit">
        Replace authorized eBook
      </button>
    </form>
  );
}
