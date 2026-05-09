"use client";

import { useState } from "react";
import Link from "next/link";

const initialForm = {
  fullName: "",
  governmentId: "",
  phone: "",
  emergencyContact: "",
  tripStartDate: "",
  tripEndDate: "",
  plannedItinerary: "",
  trackingConsent: true,
};

export default function RegistrationForm() {
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setCreated(null);

    const response = await fetch("/api/register-tourist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Registration failed.");
    } else {
      localStorage.setItem("geoGuardTouristId", data.touristId);
      setCreated(data.tourist);
      setForm(initialForm);
    }

    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <form onSubmit={submit} className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 lg:p-8 shadow-[var(--shadow-soft)] transition-all">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)]">
            Full name
            <input className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)]">
            Aadhaar / passport number
            <input
              className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              value={form.governmentId}
              onChange={(e) => updateField("governmentId", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)]">
            Phone number
            <input className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)]">
            Emergency contact
            <input
              className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              value={form.emergencyContact}
              onChange={(e) => updateField("emergencyContact", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)]">
            Trip start date
            <input
              type="date"
              className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              value={form.tripStartDate}
              onChange={(e) => updateField("tripStartDate", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)]">
            Trip end date
            <input
              type="date"
              className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              value={form.tripEndDate}
              onChange={(e) => updateField("tripEndDate", e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--heading)] md:col-span-2">
            Planned itinerary
            <textarea
              className="min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-[family-name:var(--font-sans)] outline-none transition-all duration-200 focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
              value={form.plannedItinerary}
              onChange={(e) => updateField("plannedItinerary", e.target.value)}
              rows={4}
              placeholder="Red Fort, India Gate, museum visit, hotel area"
              required
            />
          </label>
        </div>

        <label className="mt-6 flex items-center gap-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 text-sm font-medium text-[var(--text)] shadow-inner">
          <input
            type="checkbox"
            checked={form.trackingConsent}
            onChange={(e) => updateField("trackingConsent", e.target.checked)}
            className="h-4 w-4"
          />
          I consent to trip-duration safety tracking.
        </label>

        {error ? <p className="mt-4 rounded-md bg-[var(--danger)] p-3 text-sm text-[var(--bg)]">{error}</p> : null}

        <button
          disabled={loading}
          className="mt-8 min-h-[3.5rem] w-full rounded-xl px-4 text-base font-bold shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--brand-strong)] disabled:opacity-60 disabled:hover:translate-y-0 text-[var(--bg)] bg-[var(--brand)] border border-transparent"
        >
          {loading ? "Generating ID" : "Register and Generate Tourist ID"}
        </button>
      </form>

      <aside className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 lg:p-8 shadow-[var(--shadow-soft)] transition-all">
        <h2 className="text-lg font-semibold text-[var(--heading)]">Digital Tourist ID</h2>
        {created ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-strong)] p-5 shadow-inner">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">Temporary ID</p>
              <p className="mt-2 break-all font-mono text-2xl font-black text-[var(--heading)]">{created.touristId}</p>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Valid from {created.tripStartDate} to {created.tripEndDate}. Integrity hash is stored with SHA-256.
            </p>
            <p className="break-all rounded-md bg-[var(--bg)] border border-[var(--border)] p-3 font-mono text-xs text-[var(--text-muted)]">
              {created.idHash}
            </p>
            <Link
              href="/tourist"
              className="mt-6 block rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3.5 text-center text-sm font-bold shadow-lg transition-all duration-300 hover:-translate-y-1 text-[var(--heading)] hover:bg-[var(--surface-strong)]"
            >
              Open Tourist Dashboard
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
            <p>After submission, this panel shows the ID, trip validity, and hash.</p>
            <p>Tracking is opt-in and can be changed from the tourist dashboard.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
