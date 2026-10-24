"use client";

import { useRouter } from "next/navigation";

export function FeatureToggles({
  flags,
}: {
  flags: { key: string; enabled: boolean; description: string | null }[];
}) {
  const router = useRouter();
  return (
    <div className="card divide-y">
      {flags.map((f) => (
        <label key={f.key} className="flex items-center justify-between gap-4 p-4">
          <span>
            <strong>{f.key}</strong>
            <span className="block text-sm text-[var(--muted)]">{f.description}</span>
          </span>
          <input
            type="checkbox"
            defaultChecked={f.enabled}
            onChange={async (e) => {
              await fetch("/api/admin/features", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: f.key, enabled: e.target.checked }),
              });
              router.refresh();
            }}
          />
        </label>
      ))}
    </div>
  );
}
