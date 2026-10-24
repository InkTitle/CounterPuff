"use client";

import { X } from "lucide-react";
import { Suspense, createContext, useContext, useEffect, useState } from "react";
import { SignInForm, SignUpForm } from "./auth-forms";
import { Wordmark } from "./ui";

type Mode = "signin" | "signup";
const AuthUi = createContext<{ open: (mode: Mode) => void } | null>(null);

export function useAuthUi() {
  const ctx = useContext(AuthUi);
  if (!ctx) throw new Error("Auth UI is not available");
  return ctx;
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  return (
    <AuthUi.Provider value={{ open: setMode }}>
      {children}
      {mode ? <AuthModal mode={mode} onClose={() => setMode(null)} onSwitch={setMode} /> : null}
    </AuthUi.Provider>
  );
}

function AuthModal({
  mode,
  onClose,
  onSwitch,
}: {
  mode: Mode;
  onClose: () => void;
  onSwitch: (next: Mode) => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(14,36,56,0.55)] p-4 py-8 sm:items-center">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close sign-in or sign-up" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="card relative z-10 w-full max-w-lg p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-full p-2 text-[var(--navy)] hover:bg-[var(--ice-2)]"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <Wordmark />
        {mode === "signin" ? (
          <>
            <h2 id="auth-modal-title" className="mt-4 font-serif text-3xl text-[var(--navy)]">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Use the email and password for your CounterPuff account.</p>
            <div className="mt-6">
              <Suspense fallback={<p>Loading…</p>}>
                <SignInForm />
              </Suspense>
            </div>
            <p className="mt-5 text-sm">
              New here?{" "}
              <button type="button" className="underline" onClick={() => onSwitch("signup")}>
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 id="auth-modal-title" className="mt-4 font-serif text-3xl text-[var(--navy)]">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              After you register, an administrator must activate the account before the full dashboard opens.
            </p>
            <div className="mt-6">
              <SignUpForm />
            </div>
            <p className="mt-5 text-sm">
              Already registered?{" "}
              <button type="button" className="underline" onClick={() => onSwitch("signin")}>
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function SignInButton({ className = "btn btn-ghost" }: { className?: string }) {
  const { open } = useAuthUi();
  return (
    <button type="button" className={className} onClick={() => open("signin")}>
      Sign In
    </button>
  );
}

export function SignUpButton({
  className = "btn btn-primary",
  children = "Sign Up",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useAuthUi();
  return (
    <button type="button" className={className} onClick={() => open("signup")}>
      {children}
    </button>
  );
}
