import Link from "next/link";
import AppShell from "@/components/AppShell";
import IdVerifier from "@/components/IdVerifier";

export default function Home() {
  return (
    <AppShell
      eyebrow="Tourist Guide"
      title="Smart Tourist Safety Monitoring & Incident Response System"
      subtitle="Register tourists, issue temporary digital IDs, track opt-in live locations, detect risk zones, trigger SOS alerts, and monitor incidents from one Next.js codebase."
      actions={
        <>
          <Link href="/register" className="rounded-xl bg-[var(--brand)] text-[var(--bg)] px-6 py-3.5 text-sm font-bold shadow-lg transition-all duration-300 hover:bg-[var(--brand-strong)] hover:-translate-y-1">
            Register as Tourist
          </Link>
          <Link href="/admin" className="rounded-xl bg-[var(--surface)] text-[var(--heading)] border border-[var(--border)] px-6 py-3.5 text-sm font-bold shadow-lg transition-all duration-300 hover:bg-[var(--surface-strong)] hover:border-[var(--border-strong)] hover:-translate-y-1">
            Open Admin
          </Link>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="grid gap-4 sm:grid-cols-2">
          <Feature title="Digital Tourist ID" text="Trip-duration ID with SHA-256 integrity verification." />
          <Feature title="Opt-in Tracking" text="Tourist consent controls whether location updates are stored." />
          <Feature title="Geo-Fencing" text="Haversine checks against restricted and high-risk zones." />
          <Feature title="SOS Response" text="Critical panic alerts appear instantly on the admin dashboard." />
          <Feature title="AI Rules" text="Simple anomaly scoring for no movement, signal drops, and route deviation." />
          <Feature title="Unified Stack" text="Next.js App Router pages and API routes in one JavaScript project." />
        </section>
        <IdVerifier />
      </div>
    </AppShell>
  );
}

function Feature({ title, text }) {
  return (
    <article className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--border-strong)]">
      <h2 className="text-xl font-bold text-[var(--heading)] mb-3">{title}</h2>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">{text}</p>
    </article>
  );
}
