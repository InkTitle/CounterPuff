"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { COUNTRIES, CURRENCIES } from "@/lib/constants";
import { ErrorText } from "./ui";

function guessCountry() {
  const locale = typeof navigator !== "undefined" ? navigator.language : "en-US";
  const region = locale.split("-")[1]?.toUpperCase();
  const match = COUNTRIES.find((c) => c.code === region);
  return match ?? COUNTRIES.find((c) => c.code === "US")!;
}

export function SignUpForm() {
  const router = useRouter();
  const guess = useMemo(guessCountry, []);
  const [country, setCountry] = useState(guess.code);
  const [currency, setCurrency] = useState(guess.currency);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string[] | undefined>>({});
  const [pending, setPending] = useState(false);
  const currencies = Object.keys(CURRENCIES);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      country,
      place: String(form.get("place") ?? "") || null,
      currency,
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      acceptTerms: form.get("acceptTerms") === "on",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create the account.");
      setFields(data.fields ?? {});
      return;
    }
    router.push("/pending");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="field">
        <label htmlFor="fullName">Full name</label>
        <input id="fullName" name="fullName" autoComplete="name" required />
        <ErrorText>{fields.fullName?.[0]}</ErrorText>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <ErrorText>{fields.email?.[0]}</ErrorText>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            value={country}
            onChange={(e) => {
              const next = e.target.value;
              setCountry(next);
              const match = COUNTRIES.find((c) => c.code === next);
              if (match) setCurrency(match.currency);
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="currency">Currency</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c} ({CURRENCIES[c].symbol})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="place">Place (optional)</label>
        <input id="place" name="place" autoComplete="address-level2" placeholder="City or region" />
      </div>
      <p className="text-sm text-[var(--muted)]">
        We’ve automatically selected your country and currency to personalize your savings estimates. You can change
        these settings at any time.
      </p>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} />
        <ErrorText>{fields.password?.[0]}</ErrorText>
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        <ErrorText>{fields.confirmPassword?.[0]}</ErrorText>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptTerms" className="mt-1" required />
        <span>
          I accept the{" "}
          <Link href="/privacy" className="underline">
            privacy notice
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline">
            terms
          </Link>
          .
        </span>
      </label>
      <ErrorText>{error}</ErrorText>
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not sign in.");
      return;
    }
    if (data.status === "PENDING_APPROVAL") {
      router.push("/pending");
    } else if (data.role === "admin") {
      router.push("/admin");
    } else {
      router.push(params.get("next") || "/home");
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <ErrorText>{error}</ErrorText>
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "") }),
    });
    const data = await res.json();
    setPending(false);
    setMessage(data.message ?? "If an account exists, reset instructions will be prepared.");
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Submitting…" : "Request reset"}
      </button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: String(form.get("password") ?? ""),
        confirmPassword: String(form.get("confirmPassword") ?? ""),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not reset password.");
      return;
    }
    router.push("/login");
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="field">
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" required minLength={10} />
      </div>
      <div className="field">
        <label htmlFor="confirmPassword">Confirm password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <ErrorText>{error}</ErrorText>
      <button className="btn btn-primary" disabled={pending} type="submit">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
