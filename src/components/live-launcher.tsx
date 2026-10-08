"use client";
import Link from "next/link";
import { useState } from "react";
import { BrandWordmark } from "./brand-wordmark";
import type { liveStatus } from "@/server/live-status";
export function LiveLauncher({
  status,
}: {
  status: ReturnType<typeof liveStatus>;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "buyer", accessCode: code }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not start the session.");
      if (result.fixtureWorkspace || result.modes.ai !== "live")
        throw new Error(
          "The server did not create a live AI workspace. Check its configuration.",
        );
      window.location.assign("/shop");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Please try again.");
      setBusy(false);
    }
  }
  return (
    <main className="app-shell demo-launcher">
      <header>
        <Link href="/shop" aria-label="DALE home">
          <BrandWordmark />
        </Link>
        <Link href="/demo">Guided fixture tests ↗</Link>
      </header>
      <span className="eyebrow">LIVE INTEGRATION TEST</span>
      <h1>
        Meet DALE.
        <br />
        <em>With Gemini.</em>
      </h1>
      <p>
        Start a fresh private shopping session using the configured model. Your
        messages and voluntarily submitted images go to Google. Shipping remains
        simulated. Purchases and refunds require separate approval.
      </p>
      <p>
        <strong>{status.model}</strong> · {status.payments} ·{" "}
        {status.voiceReady
          ? "Live microphone available"
          : "Live microphone disabled"}
      </p>
      {!status.ready && (
        <div role="status">
          <p>Live AI is not ready on this server:</p>
          <ul>
            {status.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void start();
        }}
      >
        {status.accessCodeRequired && (
          <label>
            Shopper access code
            <input
              type="password"
              autoComplete="off"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
          </label>
        )}
        <button
          className="button primary"
          type="submit"
          disabled={!status.ready || busy}
        >
          {busy ? "Starting live session…" : "Start live shopping"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      <p>
        Ask in your own words. Reviewed charging evidence covers MacBook Air
        M1/M2 and the 13-inch MacBook Pro M1. Unsupported devices require more
        evidence; a model response cannot establish compatibility by itself.
      </p>
    </main>
  );
}
