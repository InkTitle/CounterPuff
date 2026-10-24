"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, CURRENCIES, TOBACCO_PRODUCTS, TRIGGERS } from "@/lib/constants";
import { classifySupportTrack, combinedDailyCost, formatMoney, type ProductUsage } from "@/lib/calculations";
import { ErrorText } from "./ui";

type ProductDraft = ProductUsage & { selected: boolean };

const emptyProducts = (): ProductDraft[] =>
  TOBACCO_PRODUCTS.filter((p) => p.id !== "none").map((p) => ({
    productType: p.id,
    quantityPerDay: null,
    packSize: null,
    pricePerPack: null,
    monthlySpend: null,
    isEstimate: true,
    selected: false,
  }));

type SavedProduct = ProductUsage & { productType: string };

function productsFromSaved(saved: SavedProduct[]): ProductDraft[] {
  const base = emptyProducts();
  return base.map((p) => {
    const found = saved.find((s) => s.productType === p.productType);
    return found
      ? {
          ...p,
          quantityPerDay: found.quantityPerDay,
          packSize: found.packSize,
          pricePerPack: found.pricePerPack,
          monthlySpend: found.monthlySpend,
          isEstimate: found.isEstimate ?? true,
          selected: true,
        }
      : p;
  });
}

export function OnboardingFlow({
  initialCountry,
  initialCurrency,
  initialStep = 1,
  initialNone = false,
  initialProducts = [],
  initialTriggers = [],
  initialLocalTime = "",
  initialPlan = "preparation",
  initialQuitDate = "",
}: {
  initialCountry: string;
  initialCurrency: string;
  initialStep?: number;
  initialNone?: boolean;
  initialProducts?: SavedProduct[];
  initialTriggers?: string[];
  initialLocalTime?: string;
  initialPlan?: "preparation" | "immediate";
  initialQuitDate?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(Math.min(6, Math.max(1, initialStep || 1)));
  const [none, setNone] = useState(initialNone);
  const [products, setProducts] = useState<ProductDraft[]>(() =>
    initialProducts.length ? productsFromSaved(initialProducts) : emptyProducts(),
  );
  const [triggers, setTriggers] = useState<string[]>(initialTriggers);
  const [localTime, setLocalTime] = useState(initialLocalTime);
  const [country, setCountry] = useState(initialCountry);
  const [currency, setCurrency] = useState(initialCurrency);
  const [plan, setPlan] = useState<"preparation" | "immediate">(initialPlan);
  const [quitDate, setQuitDate] = useState(initialQuitDate);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selected = products.filter((p) => p.selected);
  const track = useMemo(() => classifySupportTrack(selected), [selected]);
  const daily = combinedDailyCost(selected);

  function toggleProduct(id: string) {
    if (id === "none") {
      setNone(true);
      setProducts(emptyProducts());
      return;
    }
    setNone(false);
    setProducts((rows) => rows.map((r) => (r.productType === id ? { ...r, selected: !r.selected } : r)));
  }

  function toggleTrigger(id: string) {
    setTriggers((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return cur;
      return [...cur, id];
    });
  }

  async function save(complete = false, nextStep = step) {
    setPending(true);
    setError(null);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: Math.min(6, Math.max(0, nextStep)),
        complete,
        products: none ? [] : selected,
        triggers: triggers.map((t, i) => ({ triggerKey: t, isPrimary: i === 0, localTime: i === 0 ? localTime : undefined })),
        country,
        currency,
        quitPlanType: plan,
        quitDate: quitDate || null,
        supportTrack: track.track,
        draft: { step, none, triggers, plan, quitDate },
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save.");
      return false;
    }
    return true;
  }

  async function next() {
    const ok = await save(step === 6, step === 6 ? 6 : step + 1);
    if (!ok) return;
    if (step === 6) {
      router.push("/home");
      router.refresh();
      return;
    }
    setStep((s) => s + 1);
  }

  return (
    <div className="card p-6 sm:p-8">
      <p className="text-sm text-[var(--muted)]">Step {step} of 6</p>
      <div className="progress-bar mt-2">
        <span style={{ width: `${(step / 6) * 100}%` }} />
      </div>

      {step === 1 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-[var(--navy)]">Which tobacco or nicotine products do you currently use?</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">Select all that apply.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TOBACCO_PRODUCTS.map((p) => {
              const on = p.id === "none" ? none : products.find((x) => x.productType === p.id)?.selected;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggleProduct(p.id)}
                  className={`rounded-2xl border px-4 py-3 text-left ${on ? "border-[var(--green)] bg-[#eefbf0]" : "border-[var(--line)] bg-white"}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-5">
          <h2 className="text-2xl font-semibold text-[var(--navy)]">Usage and spending</h2>
          <p className="text-sm text-[var(--muted)]">
            Enter what you know. Estimates are allowed. Leave a field blank rather than guessing a number you do not
            have.
          </p>
          {none || selected.length === 0 ? (
            <p>No products selected. You can continue.</p>
          ) : (
            selected.map((p) => {
              const meta = TOBACCO_PRODUCTS.find((x) => x.id === p.productType)!;
              return (
                <fieldset key={p.productType} className="rounded-2xl border border-[var(--line)] p-4">
                  <legend className="px-2 font-semibold">{meta.label}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="field">
                      Average quantity per day
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={p.quantityPerDay ?? ""}
                        onChange={(e) =>
                          setProducts((rows) =>
                            rows.map((r) =>
                              r.productType === p.productType
                                ? { ...r, quantityPerDay: e.target.value === "" ? null : Number(e.target.value) }
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      {meta.packLabel || "Pack size"}
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={p.packSize ?? ""}
                        onChange={(e) =>
                          setProducts((rows) =>
                            rows.map((r) =>
                              r.productType === p.productType
                                ? { ...r, packSize: e.target.value === "" ? null : Number(e.target.value) }
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      Price per pack / tin / device
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={p.pricePerPack ?? ""}
                        onChange={(e) =>
                          setProducts((rows) =>
                            rows.map((r) =>
                              r.productType === p.productType
                                ? { ...r, pricePerPack: e.target.value === "" ? null : Number(e.target.value) }
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      Monthly spend (if easier)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={p.monthlySpend ?? ""}
                        onChange={(e) =>
                          setProducts((rows) =>
                            rows.map((r) =>
                              r.productType === p.productType
                                ? { ...r, monthlySpend: e.target.value === "" ? null : Number(e.target.value) }
                                : r,
                            ),
                          )
                        }
                      />
                    </label>
                  </div>
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={p.isEstimate !== false}
                      onChange={(e) =>
                        setProducts((rows) =>
                          rows.map((r) => (r.productType === p.productType ? { ...r, isEstimate: e.target.checked } : r)),
                        )
                      }
                    />
                    These figures are estimates
                  </label>
                </fieldset>
              );
            })
          )}
        </div>
      )}

      {step === 3 && (
        <div className="mt-6">
          <h2 className="text-2xl font-semibold text-[var(--navy)]">When are your urges most difficult to manage?</h2>
          <p className="text-sm text-[var(--muted)]">Select up to two.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TRIGGERS.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => toggleTrigger(t.id)}
                className={`rounded-2xl border px-4 py-3 text-left ${triggers.includes(t.id) ? "border-[var(--amber)] bg-[#fff6e8]" : "border-[var(--line)]"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="field mt-4 max-w-xs">
            Optional local time for your hardest window
            <input type="time" value={localTime} onChange={(e) => setLocalTime(e.target.value)} />
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--navy)]">Country and currency</h2>
          <p className="text-sm text-[var(--muted)]">
            We’ve automatically selected your country and currency to personalize your savings estimates. You can change
            these settings at any time.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              Country
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  const match = COUNTRIES.find((c) => c.code === e.target.value);
                  if (match) setCurrency(match.currency);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Currency
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {Object.keys(CURRENCIES).map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCIES[c].symbol})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--navy)]">How would you like to begin?</h2>
          <button
            type="button"
            onClick={() => setPlan("preparation")}
            className={`w-full rounded-2xl border p-4 text-left ${plan === "preparation" ? "border-[var(--green)] bg-[#eefbf0]" : "border-[var(--line)]"}`}
          >
            <strong>Preparation plan.</strong> Work through the eBook, observe current habits, and choose a target quit
            date when you are ready. This never requires you to keep using tobacco.
          </button>
          <button
            type="button"
            onClick={() => setPlan("immediate")}
            className={`w-full rounded-2xl border p-4 text-left ${plan === "immediate" ? "border-[var(--green)] bg-[#eefbf0]" : "border-[var(--line)]"}`}
          >
            <strong>Immediate quit plan.</strong> Begin your chosen quit attempt now.
          </button>
          <label className="field max-w-xs">
            Target quit date (optional)
            <input type="date" value={quitDate} onChange={(e) => setQuitDate(e.target.value)} />
          </label>
        </div>
      )}

      {step === 6 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-2xl font-semibold text-[var(--navy)]">Your personalized plan</h2>
          <p>
            Products: {none || selected.length === 0 ? "none currently used" : selected.map((p) => p.productType).join(", ")}
          </p>
          <p>
            Estimated typical daily spend: {formatMoney(daily, currency)}
            {selected.some((p) => p.isEstimate !== false) ? " (includes estimates)" : ""}
          </p>
          <p>Triggers: {triggers.join(", ") || "not specified"}</p>
          <p>
            Approach: {plan}
            {quitDate ? ` · target date ${quitDate}` : ""}
          </p>
          <p>
            Support track: <strong>{track.track}</strong>. {track.explanation}
          </p>
          <p className="text-sm text-[var(--muted)]">
            This classification is a nonclinical personalization tool, not a medical diagnosis.
          </p>
        </div>
      )}

      <ErrorText>{error}</ErrorText>
      <div className="mt-6 flex flex-wrap gap-3">
        {step > 1 ? (
          <button type="button" className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
            Back
          </button>
        ) : null}
        <button type="button" className="btn btn-primary" disabled={pending} onClick={next}>
          {pending ? "Saving…" : step === 6 ? "Save plan" : "Continue"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => save(false, step)}
          disabled={pending}
        >
          Save and finish later
        </button>
      </div>
    </div>
  );
}
