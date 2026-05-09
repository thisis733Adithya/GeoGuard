"use client";

import { useState } from "react";
import StatusBadge from "./StatusBadge";

export default function IdVerifier({ initialTouristId = "" }) {
  const [touristId, setTouristId] = useState(initialTouristId);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    setResult(null);
    const response = await fetch("/api/verify-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touristId }),
    });
    const data = await response.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-base font-semibold text-[var(--heading)]">Tamper-Proof ID Verification</h2>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={touristId}
          onChange={(event) => setTouristId(event.target.value)}
          placeholder="TID-2026-ABCDE"
          className="min-h-[3rem] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 text-sm text-[var(--text)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all duration-300"
        />
        <button
          onClick={verify}
          disabled={!touristId || loading}
          className="rounded-xl bg-[var(--brand)] px-6 py-2 text-sm font-bold text-[var(--bg)] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--brand-strong)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? "Checking" : "Verify"}
        </button>
      </div>
      {result ? (
        <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={result.verified ? "verified" : "critical"} />
            <StatusBadge value={result.validForTrip ? "active" : "expired"} />
          </div>
          <p>{result.message}</p>
          {result.storedHash ? (
            <p className="break-all font-mono text-xs text-slate-500">SHA-256: {result.storedHash}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
