"use client";

import { useEffect, useState, type FormEvent } from "react";
import type {
  PasswordAuthMode,
  PasswordAuthResponse,
  SessionUser,
} from "@/lib/demo-types";

type AuthModalProps = {
  open: boolean;
  initialError?: string | null;
  onAuthenticated: (user: SessionUser | null) => Promise<void> | void;
};

const modeCopy: Record<
  PasswordAuthMode,
  {
    title: string;
    submit: string;
    switchLabel: string;
    switchAction: string;
  }
> = {
  "sign-in": {
    title: "Sign in to open Rovik",
    submit: "Sign in",
    switchLabel: "Need an account?",
    switchAction: "Sign up",
  },
  "sign-up": {
    title: "Create your Rovik account",
    submit: "Create account",
    switchLabel: "Already have an account?",
    switchAction: "Sign in",
  },
};

export function AuthModal({
  open,
  initialError,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<PasswordAuthMode>("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    setMessage(initialError ?? null);
  }, [initialError]);

  if (!open) {
    return null;
  }

  const copy = modeCopy[mode];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          email,
          password,
        }),
      });

      const payload = (await response.json()) as PasswordAuthResponse;

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Authentication failed.");
      }

      if (payload.needsEmailConfirmation) {
        setMessage(
          payload.message ||
            "Account created. Check your email to confirm it, then sign in.",
        );
        setMode("sign-in");
        setPassword("");
        return;
      }

      await onAuthenticated(payload.user ?? null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setMessage(null);
    setPassword("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,8,15,0.72)] px-4 py-6 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2rem] border border-[rgba(57,219,194,0.18)] bg-[linear-gradient(180deg,rgba(12,24,38,0.98),rgba(7,15,25,0.98))] p-6 text-white shadow-[0_30px_100px_rgba(0,0,0,0.45)] md:p-7">
        <p className="text-xs uppercase tracking-[0.24em] text-white/42">
          Access required
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
          {copy.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/62">
          Sign in before using the live demo so Rovik can keep your conversation
          history and saved context tied to your account.
        </p>

        <a
          href="/api/auth/google?next=/demo"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-[rgba(57,219,194,0.24)] bg-[rgba(57,219,194,0.1)] px-5 py-3 text-sm font-semibold text-[rgba(177,245,232,0.96)] transition duration-200 hover:-translate-y-0.5"
        >
          Continue with Gmail
        </a>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-[0.2em] text-white/34">
            or
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/42">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-white/26 focus:border-[rgba(57,219,194,0.32)]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/42">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              required
              minLength={8}
              className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition duration-200 placeholder:text-white/26 focus:border-[rgba(57,219,194,0.32)]"
              placeholder="At least 8 characters"
            />
          </label>

          {message ? (
            <div className="rounded-[1.1rem] border border-[rgba(57,219,194,0.16)] bg-[rgba(57,219,194,0.08)] px-4 py-3 text-sm leading-6 text-white/82">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#39dbc2_0%,#0f8a7b_100%)] px-5 py-3 text-sm font-semibold text-[#04131d] transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? "Working..." : copy.submit}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-white/56">
          {copy.switchLabel}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="font-medium text-[rgba(177,245,232,0.96)]"
          >
            {copy.switchAction}
          </button>
        </div>
      </div>
    </div>
  );
}
