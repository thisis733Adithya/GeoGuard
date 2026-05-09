"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import NavMenu from "./NavMenu";

const dropdownItems = [
  { href: "/", label: "🏠 Home" },
  { href: "/tourist", label: "🧭 Tourist Dashboard" },
  { href: "/saved-places", label: "Saved Places" },
  { href: "/risk-zones", label: "⚠️ Risk Zones" },
  { href: "/admin", label: "🛡️ Admin" },
];

function BellButton({ unread = 0 }) {
  return (
    <Link
      href="/alerts"
      className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[var(--text-muted)] transition-all hover:bg-[var(--surface-strong)] hover:text-[var(--heading)]"
      title="Alerts"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--danger)] text-[0.6rem] font-black text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}

export default function AppShell({ children, eyebrow, title, subtitle, actions }) {
  const { data: session, status } = useSession();

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-[85.3vh] w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="app-header flex flex-col gap-4 border-b border-[var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="brand-mark grid h-17 w-17 place-items-center text-xl">
              <img src="/logo.png" alt="logo" />
            </span>
            <span>
              <span className="brand-title block text-lg font-semibold">Geo Guard</span>
              <span className="brand-subtitle block text-xs text-slate-400">Tourist Safety Command</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex items-center gap-1">
              {/* Auth buttons */}
              {status === "loading" ? (
                <div className="h-9 w-9 animate-pulse rounded-xl bg-[var(--surface-strong)]" />
              ) : session ? (
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-[var(--text-muted)] sm:block">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text-muted)] transition-all hover:bg-[var(--danger)] hover:text-white hover:border-[var(--danger)]"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-[var(--bg)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-strong)]"
                >
                 Admin Login
                </Link>
              )}

              {/* Dropdown menu then bell right beside it */}
              <NavMenu items={dropdownItems} />
              <BellButton />
            </nav>

            <ThemeToggle />
          </div>
        </header>

        <section className="hero-band flex flex-col items-center justify-center text-center gap-6 py-12">
          <div className="flex flex-col items-center">
            {eyebrow ? (
              <p className="eyebrow mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted)">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="hero-title max-w-4xl text-4xl font-bold text-[var(--heading)] sm:text-5xl">{title}</h1>
            {subtitle ? <p className="hero-copy mt-4 max-w-2xl text-lg text-[var(--text-muted)]">{subtitle}</p> : null}
          </div>
          {actions ? <div className="hero-actions flex flex-wrap items-center justify-center gap-4 mt-2">{actions}</div> : null}
        </section>

        <div className="flex-1 pb-10">{children}</div>
      </div>
    </main>
  );
}
