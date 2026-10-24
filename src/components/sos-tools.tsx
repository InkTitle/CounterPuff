"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MOTIVATIONAL_MESSAGES } from "@/lib/constants";
import { ErrorText } from "./ui";

type Tool = "menu" | "game" | "questions" | "breathe" | "messages";

async function saveSession(payload: Record<string, unknown>) {
  const res = await fetch("/api/cravings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function Outcome({
  onDone,
}: {
  onDone: (v: "eased" | "somewhat" | "still_strong" | "used" | "prefer_not") => void;
}) {
  return (
    <div className="card mt-6 p-5">
      <h3 className="font-semibold text-[var(--navy)]">Did this activity help you manage the craving?</h3>
      <div className="mt-3 grid gap-2">
        {[
          ["eased", "Yes, the urge has eased"],
          ["somewhat", "Somewhat"],
          ["still_strong", "The urge is still strong"],
          ["used", "I chose to use tobacco or nicotine"],
          ["prefer_not", "I prefer not to answer"],
        ].map(([v, label]) => (
          <button key={v} type="button" className="btn btn-ghost justify-start" onClick={() => onDone(v as "eased")}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const ICONS = ["🍃", "💧", "☀️", "🌙", "⭐", "🌊", "🍀", "🔥"];

export function SosExperience() {
  const [tool, setTool] = useState<Tool>("menu");
  const [outcomeNote, setOutcomeNote] = useState<string | null>(null);

  async function finish(toolUsed: string, extra: Record<string, unknown>, outcome: string) {
    await saveSession({ toolUsed, ...extra, outcome });
    if (outcome === "used") {
      setOutcomeNote(
        "A lapse does not erase your history. You can log today honestly and continue. Your previous achievements stay in place.",
      );
    } else if (outcome === "still_strong") {
      setOutcomeNote("You can restart SOS or change tools. If you need medical help, contact local emergency services.");
    } else {
      setOutcomeNote("Well noticed. You can return to the dashboard or run SOS again if another wave arrives.");
    }
    setTool("menu");
  }

  return (
    <div>
      {tool === "menu" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" className="card p-5 text-left" onClick={() => setTool("game")}>
            <h2 className="text-xl font-semibold">3-minute focus game</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">A memory match to occupy the next few minutes.</p>
          </button>
          <button type="button" className="card p-5 text-left" onClick={() => setTool("questions")}>
            <h2 className="text-xl font-semibold">Pattern-interrupt questions</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Separate the urge into body, trigger, and next feeling.</p>
          </button>
          <button type="button" className="card p-5 text-left" onClick={() => setTool("breathe")}>
            <h2 className="text-xl font-semibold">Guided breathing</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Box breathing, with a no-hold option.</p>
          </button>
          <button type="button" className="card p-5 text-left" onClick={() => setTool("messages")}>
            <h2 className="text-xl font-semibold">Supportive messages</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Short lines you can read while the wave passes.</p>
          </button>
        </div>
      )}
      {outcomeNote ? <p className="card mt-4 p-4 text-sm">{outcomeNote}</p> : null}
      {tool === "game" && <MemoryGame onExit={() => setTool("menu")} onFinish={(o, extra) => finish("game", extra, o)} />}
      {tool === "questions" && <Questions onExit={() => setTool("menu")} onFinish={(o, extra) => finish("questions", extra, o)} />}
      {tool === "breathe" && <Breathing onExit={() => setTool("menu")} onFinish={(o, extra) => finish("breathe", extra, o)} />}
      {tool === "messages" && <Messages onExit={() => setTool("menu")} onFinish={(o, extra) => finish("messages", extra, o)} />}
    </div>
  );
}

function MemoryGame({
  onExit,
  onFinish,
}: {
  onExit: () => void;
  onFinish: (o: string, extra: Record<string, unknown>) => void;
}) {
  const [round, setRound] = useState(0);
  const deck = useMemo(() => {
    const pairs = ICONS.flatMap((icon, i) => [
      { id: `${round}-${i}a`, icon, pair: i },
      { id: `${round}-${i}b`, icon, pair: i },
    ]);
    return pairs.sort(() => Math.random() - 0.5);
  }, [round]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [seconds, setSeconds] = useState(180);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (seconds === 0 || matched.length === deck.length) setDone(true);
  }, [seconds, matched, deck.length]);

  function click(id: string, pair: number) {
    if (lock || done || matched.includes(id) || flipped.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next;
      const pa = deck.find((c) => c.id === a)!;
      const pb = deck.find((c) => c.id === b)!;
      setLock(true);
      setTimeout(() => {
        if (pa.pair === pb.pair) setMatched((m) => [...m, a, b]);
        setFlipped([]);
        setLock(false);
      }, 650);
      void pair;
    }
  }

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">
          Time left: {mm}:{ss}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setRound((n) => n + 1);
              setFlipped([]);
              setMatched([]);
              setLock(false);
              setSeconds(180);
              setDone(false);
            }}
          >
            Restart
          </button>
          <button type="button" className="btn btn-ghost" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>
      <p className="mb-3 text-sm text-[var(--muted)]">
        Find matching pairs. Icons are also labeled by index so the game does not rely on color alone.
      </p>
      <div className="grid grid-cols-4 gap-2">
        {deck.map((card, idx) => {
          const up = flipped.includes(card.id) || matched.includes(card.id);
          return (
            <button
              key={card.id}
              type="button"
              aria-label={up ? `Pair ${card.pair + 1} ${card.icon}` : `Hidden card ${idx + 1}`}
              className={`game-tile ${up ? "up" : ""} ${matched.includes(card.id) ? "matched" : ""}`}
              onClick={() => click(card.id, card.pair)}
            >
              {up ? (
                <span>
                  {card.icon}
                  <span className="sr-only"> pair {card.pair + 1}</span>
                </span>
              ) : (
                "?"
              )}
            </button>
          );
        })}
      </div>
      {done ? (
        <div className="mt-4">
          <p>{matched.length === deck.length ? "You matched every pair." : "The three minutes are up. That is enough."}</p>
          <Outcome onDone={(o) => onFinish(o, { durationSeconds: 180 - seconds, answers: { matched: matched.length / 2 } })} />
        </div>
      ) : null}
    </div>
  );
}

function Questions({
  onExit,
  onFinish,
}: {
  onExit: () => void;
  onFinish: (o: string, extra: Record<string, unknown>) => void;
}) {
  const [q, setQ] = useState(0);
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [note, setNote] = useState("");

  const questions = [
    {
      text: "Where are you feeling the physical tension right now?",
      options: ["Chest", "Throat", "Jaw", "Hands", "Elsewhere", "No particular physical sensation"],
      value: a1,
      set: setA1,
    },
    {
      text: "What may have triggered this urge?",
      options: ["Anxiety", "Boredom", "Seeing someone smoking", "Finishing a meal", "Work stress", "Social situation", "Habit", "Other"],
      value: a2,
      set: setA2,
    },
    {
      text: "What do you expect will happen if you act on this urge? How would you feel ten minutes later?",
      options: [
        "Brief relief, then frustration",
        "The same as usual",
        "I am not sure",
        "I would rather wait and see",
      ],
      value: a3,
      set: setA3,
    },
  ];
  const cur = questions[q];

  return (
    <div className="card p-6">
      <button type="button" className="btn btn-ghost mb-4" onClick={onExit}>
        Exit
      </button>
      <p className="text-sm text-[var(--muted)]">Question {q + 1} of 3</p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--navy)]">{cur.text}</h2>
      <div className="mt-4 grid gap-2">
        {cur.options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`rounded-2xl border px-4 py-3 text-left ${cur.value === opt ? "border-[var(--green)] bg-[#eefbf0]" : "border-[var(--line)]"}`}
            onClick={() => cur.set(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      {q === 2 ? (
        <label className="field mt-4">
          Optional note
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </label>
      ) : null}
      <div className="mt-4 flex gap-2">
        {q > 0 ? (
          <button type="button" className="btn btn-ghost" onClick={() => setQ((n) => n - 1)}>
            Back
          </button>
        ) : null}
        {q < 2 ? (
          <button type="button" className="btn btn-primary" disabled={!cur.value} onClick={() => setQ((n) => n + 1)}>
            Next
          </button>
        ) : null}
      </div>
      {q === 2 && a3 ? (
        <div className="mt-6">
          <p>
            You noticed tension in <strong>{a1 || "an unspecified place"}</strong>, possibly linked to{" "}
            <strong>{a2 || "an unspecified trigger"}</strong>. Whatever happens in ten minutes, you can choose a smaller
            next action than the urge suggests.
          </p>
          <Outcome onDone={(o) => onFinish(o, { answers: { a1, a2, a3, note } })} />
        </div>
      ) : null}
    </div>
  );
}

function Breathing({
  onExit,
  onFinish,
}: {
  onExit: () => void;
  onFinish: (o: string, extra: Record<string, unknown>) => void;
}) {
  const [running, setRunning] = useState(false);
  const [hold, setHold] = useState(true);
  const [minutes, setMinutes] = useState(3);
  const [phase, setPhase] = useState("Ready");
  const [count, setCount] = useState(4);
  const [sound, setSound] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    if (!running) return;
    const sequence = hold
      ? [
          ["Inhale", 4],
          ["Hold", 4],
          ["Exhale", 4],
          ["Hold", 4],
        ]
      : [
          ["Inhale", 4],
          ["Exhale", 6],
        ];
    let idx = 0;
    let left = sequence[0][1] as number;
    setPhase(sequence[0][0] as string);
    setCount(left);
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
      left -= 1;
      setCount(left);
      if (soundRef.current && left === (sequence[idx][1] as number) - 1) {
        try {
          ctx.current ??= new AudioContext();
          const osc = ctx.current.createOscillator();
          const g = ctx.current.createGain();
          osc.frequency.value = 440;
          g.gain.value = 0.03;
          osc.connect(g);
          g.connect(ctx.current.destination);
          osc.start();
          osc.stop(ctx.current.currentTime + 0.08);
        } catch {
          /* ignore */
        }
      }
      if (left <= 0) {
        idx = (idx + 1) % sequence.length;
        left = sequence[idx][1] as number;
        setPhase(sequence[idx][0] as string);
        setCount(left);
      }
    }, 1000);
    const stopAt = window.setTimeout(() => {
      setRunning(false);
      setDone(true);
    }, minutes * 60 * 1000);
    return () => {
      clearInterval(timer);
      clearTimeout(stopAt);
    };
  }, [running, hold, minutes]);

  return (
    <div className="card p-6 text-center">
      <div className="mb-4 flex justify-between">
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          Exit
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setRunning(false)}>
          Stop
        </button>
      </div>
      <div className={`breathe-circle ${running ? "anim" : ""}`} aria-hidden />
      <p className="mt-4 text-2xl font-semibold text-[var(--navy)]">{phase}</p>
      <p className="text-lg">{count}s</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        This exercise does not detoxify the body or guarantee a particular effect. Stop immediately if you feel
        uncomfortable.
      </p>
      <div className="mt-4 grid gap-3 text-left sm:grid-cols-2">
        <label className="field">
          Duration (minutes)
          <input type="number" min={1} max={10} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={hold} onChange={(e) => setHold(e.target.checked)} />
          Include breath holds (uncheck for a no-hold pattern)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} />
          Gentle sound (off by default)
        </label>
      </div>
      <button type="button" className="btn btn-green mt-4" onClick={() => { setDone(false); setElapsed(0); setRunning(true); }}>
        {running ? "Pause by using Stop" : "Start"}
      </button>
      {done ? <Outcome onDone={(o) => onFinish(o, { durationSeconds: elapsed, answers: { hold, minutes } })} /> : null}
    </div>
  );
}

function Messages({
  onExit,
  onFinish,
}: {
  onExit: () => void;
  onFinish: (o: string, extra: Record<string, unknown>) => void;
}) {
  const [shown, setShown] = useState<number[]>([0]);
  const current = shown[shown.length - 1] ?? 0;
  function next() {
    const remaining = MOTIVATIONAL_MESSAGES.map((_, i) => i).filter((i) => !shown.includes(i));
    if (!remaining.length) {
      setShown([ (current + 1) % MOTIVATIONAL_MESSAGES.length ]);
      return;
    }
    setShown((s) => [...s, remaining[0]]);
  }
  return (
    <div className="card p-6">
      <button type="button" className="btn btn-ghost" onClick={onExit}>
        Exit
      </button>
      <blockquote className="mt-6 font-serif text-2xl text-[var(--navy)]">{MOTIVATIONAL_MESSAGES[current]}</blockquote>
      <button type="button" className="btn btn-primary mt-6" onClick={next}>
        Another message
      </button>
      <Outcome onDone={(o) => onFinish(o, { answers: { messageIndex: current } })} />
    </div>
  );
}

export function SosOfflineBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const go = () => setOnline(navigator.onLine);
    window.addEventListener("online", go);
    window.addEventListener("offline", go);
    go();
    return () => {
      window.removeEventListener("online", go);
      window.removeEventListener("offline", go);
    };
  }, []);
  if (online) return null;
  return (
    <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm">
      You appear to be offline. SOS tools still work on this device. Craving logs will save when the connection
      returns if the browser can reach the server.
    </p>
  );
}

export function ErrorLine({ error }: { error?: string }) {
  return <ErrorText>{error}</ErrorText>;
}
