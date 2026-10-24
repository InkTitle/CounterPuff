"use client";

import { useEffect, useRef, useState } from "react";

export function EbookReader({
  lastPage,
  pageCount,
}: {
  lastPage: number;
  pageCount: number | null;
}) {
  const total = pageCount && pageCount > 0 ? pageCount : null;
  const [page, setPage] = useState(lastPage || 1);
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  function persist(nextPage: number) {
    const percent = total ? Math.min(100, Math.round((nextPage / total) * 100)) : 0;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      fetch("/api/ebook/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: nextPage, percent }),
      }).then(async (res) => {
        if (!res.ok) setStatus("Progress could not be saved just now.");
      });
    }, 400);
  }

  useEffect(() => {
    persist(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const src = `/api/ebook/file#page=${page}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous page
        </button>
        <label className="flex items-center gap-2 text-sm">
          Page
          <input
            type="number"
            min={1}
            max={total ?? 999}
            value={page}
            onChange={(e) => setPage(Math.max(1, Number(e.target.value) || 1))}
            className="w-20 rounded-xl border border-[var(--line)] px-2 py-1"
          />
          {total ? <span>of {total}</span> : <span>Page count is unknown until the PDF is parsed.</span>}
        </label>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setPage((p) => (total ? Math.min(total, p + 1) : p + 1))}
        >
          Next page
        </button>
        <a className="btn btn-primary" href="/api/ebook/download">
          Download PDF
        </a>
      </div>
      {total ? (
        <div className="progress-bar mb-3">
          <span style={{ width: `${Math.min(100, Math.round((page / total) * 100))}%` }} />
        </div>
      ) : (
        <p className="mb-3 text-sm text-[var(--muted)]">
          Reading position is saved as a page number. Percentage completion is shown when page count is known.
        </p>
      )}
      {status ? <p className="mb-2 text-sm text-red-600">{status}</p> : null}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <iframe title="The CounterPuff Method PDF reader" src={src} className="h-[75vh] w-full" />
      </div>
    </div>
  );
}
