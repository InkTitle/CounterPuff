"use client";

import { useEffect, useState } from "react";
import { COMMUNITY_CATEGORIES } from "@/lib/constants";
import { ErrorText } from "./ui";

type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
  author: string;
  userId: string;
  createdAt: string;
  encouragements: number;
  comments: { id: string; body: string; author: string; createdAt: string }[];
};

type Chat = { id: string; body: string; userId: string; createdAt: string };

export function CommunityBoard({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [chat, setChat] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"feed" | "chat" | "help">("feed");

  async function load() {
    const feed = await fetch("/api/community").then((r) => r.json());
    if (feed.ok) setPosts(feed.posts);
    const ch = await fetch("/api/community?kind=chat").then((r) => r.json());
    if (ch.ok) setChat(ch.messages);
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 12000);
    return () => clearInterval(t);
  }, []);

  async function post(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title")),
        body: String(form.get("body")),
        category: String(form.get("category")),
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    e.currentTarget.reset();
    load();
  }

  async function sendChat(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat: true, body: String(form.get("body")) }),
    });
    e.currentTarget.reset();
    load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button type="button" className={`btn ${tab === "feed" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("feed")}>
          Feed
        </button>
        <button type="button" className={`btn ${tab === "chat" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("chat")}>
          Room chat
        </button>
        <button type="button" className={`btn ${tab === "help" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("help")}>
          Urgent help
        </button>
      </div>
      <ErrorText>{error}</ErrorText>

      {tab === "help" && (
        <div className="card space-y-3 p-5 text-sm">
          <p>
            CounterPuff is not an emergency service. If you are in immediate danger, contact local emergency services.
          </p>
          <p>
            Reputable quit support:{" "}
            <a className="underline" href="https://www.cdc.gov/tobacco/quit_smoking/" target="_blank" rel="noreferrer">
              CDC quit resources
            </a>
            ,{" "}
            <a className="underline" href="https://www.who.int/teams/health-promotion/tobacco-control" target="_blank" rel="noreferrer">
              WHO tobacco control
            </a>
            .
          </p>
          <p>You can also post in the “Need encouragement now” category for peer support — not clinical care.</p>
        </div>
      )}

      {tab === "chat" && (
        <div className="card p-5">
          <p className="text-sm text-[var(--muted)]">
            Persistent authenticated messages stored in the database. This is polling, not a live websocket. Empty until
            someone writes.
          </p>
          <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
            {chat.length === 0 ? <li>No messages yet.</li> : null}
            {chat.map((m) => (
              <li key={m.id} className="rounded-xl bg-[var(--ice)] px-3 py-2 text-sm">
                {m.body}
              </li>
            ))}
          </ul>
          <form onSubmit={sendChat} className="mt-3 flex gap-2">
            <input name="body" required maxLength={500} className="flex-1 rounded-xl border border-[var(--line)] px-3" />
            <button className="btn btn-primary" type="submit">
              Send
            </button>
          </form>
        </div>
      )}

      {tab === "feed" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {posts.length === 0 ? <p className="card p-5">No posts yet. Start a supportive thread.</p> : null}
            {posts.map((p) => (
              <article key={p.id} className="card p-5">
                <p className="text-xs uppercase tracking-wide text-[var(--muted)]">{p.category}</p>
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="mt-2 whitespace-pre-wrap">{p.body}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {p.author} · {p.encouragements} encouragements
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost py-1 text-sm"
                    onClick={() =>
                      fetch("/api/community", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ react: true, targetId: p.id }),
                      }).then(load)
                    }
                  >
                    Encourage
                  </button>
                  {p.userId !== userId ? (
                    <button
                      type="button"
                      className="btn btn-ghost py-1 text-sm"
                      onClick={() =>
                        fetch("/api/community", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ block: true, blockedId: p.userId }),
                        }).then(load)
                      }
                    >
                      Block author
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-ghost py-1 text-sm"
                    onClick={() => {
                      const reason = window.prompt("Why are you reporting this?");
                      if (!reason) return;
                      fetch("/api/community", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ report: true, targetType: "post", targetId: p.id, reason }),
                      });
                    }}
                  >
                    Report
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {p.comments.map((c) => (
                    <li key={c.id}>
                      <strong>{c.author}:</strong> {c.body}
                    </li>
                  ))}
                </ul>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    await fetch("/api/community", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ postId: p.id, body: String(form.get("body")) }),
                    });
                    e.currentTarget.reset();
                    load();
                  }}
                >
                  <input name="body" required placeholder="Encourage or reply" className="flex-1 rounded-xl border px-3" />
                  <button className="btn btn-ghost" type="submit">
                    Reply
                  </button>
                </form>
              </article>
            ))}
          </div>
          <form onSubmit={post} className="card grid h-fit gap-3 p-5">
            <h2 className="font-semibold">New post</h2>
            <label className="field">
              Category
              <select name="category" defaultValue="general">
                {COMMUNITY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Title
              <input name="title" required minLength={3} />
            </label>
            <label className="field">
              Body
              <textarea name="body" required rows={5} />
            </label>
            <button className="btn btn-primary" type="submit">
              Publish
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
