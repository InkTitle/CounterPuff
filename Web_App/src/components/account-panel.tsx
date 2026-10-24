"use client";

import { useState } from "react";
import { COUNTRIES, CURRENCIES, SUPPORT_EMAIL } from "@/lib/constants";
import { ErrorText } from "./ui";

type User = {
  id: string;
  email: string;
  fullName: string;
  country: string;
  currency: string;
  timezone: string;
  status: string;
  place: string | null;
};

export function AccountPanel({
  user,
  profile,
  reminders,
  tickets,
}: {
  user: User;
  profile: { displayName: string | null; publicProfile: boolean; privacyShareProgress: boolean } | null;
  reminders: {
    enabled: boolean;
    preferredTime: string;
    timezone: string;
    categories: string[];
    emailEnabled: boolean;
    browserEnabled: boolean;
    quietStart: string | null;
    quietEnd: string | null;
  } | null;
  tickets: { id: string; subject: string; status: string; createdAt: Date | string }[];
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: String(form.get("fullName")),
        displayName: String(form.get("displayName")),
        country: String(form.get("country")),
        currency: String(form.get("currency")),
        place: String(form.get("place") || "") || null,
        publicProfile: form.get("publicProfile") === "on",
        privacyShareProgress: form.get("privacyShareProgress") === "on",
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMsg("Profile saved.");
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(form.get("currentPassword")),
        password: String(form.get("password")),
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMsg(data.message);
  }

  async function saveReminders(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const browserEnabled = form.get("browserEnabled") === "on";
    if (browserEnabled && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: form.get("enabled") === "on",
        preferredTime: String(form.get("preferredTime")),
        timezone: String(form.get("timezone") || user.timezone),
        categories: form.getAll("categories").map(String),
        emailEnabled: form.get("emailEnabled") === "on",
        browserEnabled,
        quietStart: String(form.get("quietStart") || "") || null,
        quietEnd: String(form.get("quietEnd") || "") || null,
      }),
    });
    const data = await res.json();
    setMsg(data.message ?? "Saved.");
  }

  async function support(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: user.fullName,
        email: user.email,
        subject: String(form.get("subject")),
        body: String(form.get("body")),
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setMsg(data.message);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ErrorText>{error}</ErrorText>
      {msg ? <p className="lg:col-span-2 text-sm text-[var(--green)]">{msg}</p> : null}

      <form onSubmit={saveProfile} className="card grid gap-3 p-5">
        <h2 className="font-semibold">Profile</h2>
        <label className="field">
          Full name
          <input name="fullName" defaultValue={user.fullName} required />
        </label>
        <label className="field">
          Display name
          <input name="displayName" defaultValue={profile?.displayName ?? ""} />
        </label>
        <label className="field">
          Place
          <input name="place" defaultValue={user.place ?? ""} />
        </label>
        <label className="field">
          Country
          <select name="country" defaultValue={user.country}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Currency
          <select name="currency" defaultValue={user.currency}>
            {Object.keys(CURRENCIES).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="publicProfile" defaultChecked={profile?.publicProfile} />
          Public community profile
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="privacyShareProgress" defaultChecked={profile?.privacyShareProgress} />
          Allow sharing progress badges
        </label>
        <p className="text-sm text-[var(--muted)]">Email: {user.email}</p>
        <button className="btn btn-primary" type="submit">
          Save profile
        </button>
      </form>

      <form onSubmit={changePassword} className="card grid gap-3 p-5">
        <h2 className="font-semibold">Change password</h2>
        <label className="field">
          Current password
          <input name="currentPassword" type="password" required />
        </label>
        <label className="field">
          New password
          <input name="password" type="password" minLength={10} required />
        </label>
        <button className="btn btn-primary" type="submit">
          Update password
        </button>
      </form>

      <form onSubmit={saveReminders} className="card grid gap-3 p-5">
        <h2 className="font-semibold">Reminders</h2>
        <p className="text-sm text-[var(--muted)]">
          Browser permission is requested only if you enable browser notifications. Email reminders need SMTP.
        </p>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={reminders?.enabled} />
          Enable reminders
        </label>
        <label className="field">
          Preferred time
          <input name="preferredTime" type="time" defaultValue={reminders?.preferredTime ?? "08:00"} />
        </label>
        <label className="field">
          Timezone
          <input name="timezone" defaultValue={reminders?.timezone ?? user.timezone} />
        </label>
        <fieldset className="text-sm">
          <legend className="font-medium">Categories</legend>
          {["ebook", "sos", "morning", "progress"].map((c) => (
            <label key={c} className="mr-3">
              <input type="checkbox" name="categories" value={c} defaultChecked={reminders?.categories?.includes(c)} /> {c}
            </label>
          ))}
        </fieldset>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="emailEnabled" defaultChecked={reminders?.emailEnabled ?? true} />
          Email
        </label>
        <label className="flex gap-2 text-sm">
          <input type="checkbox" name="browserEnabled" defaultChecked={reminders?.browserEnabled} />
          Browser notifications
        </label>
        <label className="field">
          Quiet start
          <input name="quietStart" type="time" defaultValue={reminders?.quietStart ?? ""} />
        </label>
        <label className="field">
          Quiet end
          <input name="quietEnd" type="time" defaultValue={reminders?.quietEnd ?? ""} />
        </label>
        <button className="btn btn-primary" type="submit">
          Save reminders
        </button>
      </form>

      <div className="card p-5">
        <h2 className="font-semibold">Support</h2>
        <p className="mt-2 text-sm">
          FAQ: accounts start as pending approval; only an administrator can activate them. Forgotten passwords use a
          one-hour token. eBook files are served only to active entitled accounts.
        </p>
        <p className="mt-2 text-sm">
          Email{" "}
          <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <form onSubmit={support} className="mt-4 grid gap-3">
          <label className="field">
            Subject
            <input name="subject" required />
          </label>
          <label className="field">
            Message
            <textarea name="body" required minLength={10} rows={4} />
          </label>
          <button className="btn btn-primary" type="submit">
            Send to support
          </button>
        </form>
        <ul className="mt-4 text-sm">
          {tickets.map((t) => (
            <li key={t.id}>
              {t.subject} · {t.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
