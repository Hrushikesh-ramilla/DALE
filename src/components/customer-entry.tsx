"use client";
import { useState } from "react";
export function CustomerEntry({
  onComplete,
}: {
  onComplete: () => Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(body: unknown) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      await onComplete();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p>
        Your purchases and group commitments are saved privately. Guests can
        create an account later to retain access across devices.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          void submit({
            action: mode,
            email: fields.get("email"),
            password: fields.get("password"),
            ...(mode === "register" ? { name: fields.get("name") } : {}),
          });
        }}
      >
        {mode === "register" && (
          <label>
            Name
            <input name="name" required maxLength={80} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength={mode === "register" ? 12 : 1}
            maxLength={128}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
          />
        </label>
        {mode === "register" && (
          <p className="muted">
            Use at least 12 characters. Email ownership is not verified;
            password recovery is not available yet.
          </p>
        )}
        <button className="button primary full" disabled={busy}>
          {mode === "register" ? "Create account" : "Sign in"}
        </button>
      </form>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => setMode(mode === "register" ? "login" : "register")}
      >
        {mode === "register"
          ? "Already have an account? Sign in"
          : "Create an account"}
      </button>
      <button
        className="button secondary"
        disabled={busy}
        onClick={() => void submit({ action: "guest" })}
      >
        Continue as guest
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
