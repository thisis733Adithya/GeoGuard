"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import MapPanel from "./MapPanel";
import StatusBadge from "./StatusBadge";

// ── Sub-components ─────────────────────────────────────────────────────────

function Metric({ label, value, icon, tone }) {
  const toneClass = {
    green: "text-[var(--accent)]",
    amber: "text-[var(--warning)]",
    red: "text-[var(--danger)]",
    blue: "text-[var(--brand)]",
  }[tone] || "text-[var(--heading)]";

  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-[var(--shadow-soft)] flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)]">
      <div className="text-3xl shrink-0">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
        <p className={`mt-1 text-3xl font-black ${toneClass}`}>{value}</p>
      </div>
    </div>
  );
}

function AlertCard({ alert }) {
  return (
    <div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 shadow-inner transition-all hover:border-[var(--border-strong)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--heading)] truncate">{alert.touristName || alert.touristId}</span>
            <StatusBadge value={alert.severity} />
            <span className="text-xs text-[var(--text-muted)] capitalize px-2 py-0.5 rounded-md bg-[var(--surface-strong)] border border-[var(--border)]">{alert.type}</span>
          </div>
          <p className="mt-2 text-sm text-[var(--text)]">{alert.message}</p>
          {alert.suggestion && <p className="mt-1 text-xs text-[var(--text-muted)] italic">{alert.suggestion}</p>}
          {alert.location && (
            <p className="mt-1 text-xs text-[var(--text-soft)] font-mono">
              📍 {Number(alert.location.latitude).toFixed(5)}, {Number(alert.location.longitude).toFixed(5)}
            </p>
          )}
        </div>
        <p className="text-xs text-[var(--text-soft)] whitespace-nowrap">{new Date(alert.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

function TouristRow({ tourist }) {
  const score = tourist.safetyScore || 0;
  const barColor = score >= 70 ? "bg-[var(--accent)]" : score >= 40 ? "bg-[var(--warning)]" : "bg-[var(--danger)]";
  return (
    <tr className="border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-strong)]">
      <td className="py-3 pl-2 pr-4">
        <p className="font-semibold text-[var(--heading)]">{tourist.fullName}</p>
        <p className="font-mono text-xs text-[var(--text-muted)]">{tourist.touristId}</p>
      </td>
      <td className="py-3 pr-4"><StatusBadge value={tourist.status} /></td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${score}%` }} />
          </div>
          <span className="text-xs font-mono text-[var(--text)]">{score}</span>
        </div>
      </td>
      <td className="py-3 pr-4 text-xs text-[var(--text-muted)]">
        {tourist.lastKnownLocation
          ? `${Number(tourist.lastKnownLocation.latitude).toFixed(4)}, ${Number(tourist.lastKnownLocation.longitude).toFixed(4)}`
          : "No data"}
      </td>
      <td className="py-3 pr-4 text-xs text-[var(--text-muted)]">
        {tourist.lastKnownLocation?.timestamp ? new Date(tourist.lastKnownLocation.timestamp).toLocaleString() : "—"}
      </td>
      <td className="py-3 pr-2 text-xs">
        {tourist.trackingConsent
          ? <span className="text-[var(--accent)] font-semibold">✓ Enabled</span>
          : <span className="text-[var(--danger)]">✗ Disabled</span>}
      </td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminDashboardClient() {
  // ── ALL HOOKS FIRST — no early returns before this point ───────────────
  const { status } = useSession();
  const router = useRouter();

  const [tourists, setTourists] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Auth guard — must be a hook, not a conditional return
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const loadData = useCallback(async () => {
    const [touristsRes, alertsRes, zonesRes] = await Promise.all([
      fetch("/api/tourists"),
      fetch("/api/alerts"),
      fetch("/api/risk-zones"),
    ]);
    const [touristsData, alertsData, zonesData] = await Promise.all([
      touristsRes.json(),
      alertsRes.json(),
      zonesRes.json(),
    ]);
    setTourists(touristsData.tourists || []);
    setAlerts(alertsData.alerts || []);
    setZones(zonesData.zones || []);
    setLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const initial = setTimeout(loadData, 0);
    const timer = setInterval(loadData, 5000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [loadData, status]);

  // ALL useMemo HOOKS — must be at top level, before any conditional returns
  const criticalCount = useMemo(() => alerts.filter((a) => a.severity === "critical").length, [alerts]);
  const sosCount = useMemo(() => alerts.filter((a) => a.type === "sos").length, [alerts]);
  const watchCount = useMemo(() => tourists.filter((t) => t.status === "watch" || t.status === "critical").length, [tourists]);
  const avgScore = useMemo(() => {
    if (!tourists.length) return 0;
    return Math.round(tourists.reduce((s, t) => s + (t.safetyScore || 0), 0) / tourists.length);
  }, [tourists]);
  const filteredAlerts = useMemo(() => {
    if (filterSeverity === "all") return alerts;
    return alerts.filter((a) => a.severity === filterSeverity);
  }, [alerts, filterSeverity]);
  const filteredTourists = useMemo(() => {
    if (!searchQuery) return tourists;
    const q = searchQuery.toLowerCase();
    return tourists.filter((t) => t.fullName?.toLowerCase().includes(q) || t.touristId?.toLowerCase().includes(q));
  }, [tourists, searchQuery]);
  const criticalTourists = useMemo(() => tourists.filter((t) => t.status === "critical"), [tourists]);

  // ── NOW safe to conditionally render ─────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-[var(--text-muted)]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
        Verifying session…
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const tabs = ["overview", "tourists", "alerts", "zones"];

  return (
    <div className="space-y-6">
      {/* SOS banner */}
      {sosCount > 0 && (
        <div className="flex items-center gap-4 rounded-2xl border-2 border-[var(--danger)] bg-[var(--danger)]/10 p-4 shadow-inner animate-pulse">
          <span className="text-3xl">🆘</span>
          <div className="flex-1">
            <p className="font-black text-[var(--danger)] text-lg">ACTIVE SOS EMERGENCY</p>
            <p className="text-sm text-[var(--text)]">{sosCount} panic alert{sosCount > 1 ? "s" : ""} — respond immediately.</p>
          </div>
          <a href="tel:112" className="shrink-0 rounded-xl bg-[var(--danger)] px-5 py-2.5 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5">
            📞 Call 112
          </a>
        </div>
      )}

      {/* Watch banner */}
      {watchCount > 0 && sosCount === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--warning)] bg-[var(--warning)]/10 p-4">
          <span className="text-xl">⚠️</span>
          <p className="text-sm font-semibold text-[var(--warning)]">
            {watchCount} tourist{watchCount > 1 ? "s" : ""} need operator attention.
          </p>
        </div>
      )}

      {/* Metric tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Registered Tourists" value={tourists.length} icon="👤" tone="blue" />
        <Metric label="Tourists at Risk" value={watchCount} icon="⚠️" tone="amber" />
        <Metric label="Critical Alerts" value={criticalCount} icon="🚨" tone="red" />
        <Metric label="Avg Safety Score" value={`${avgScore}/100`} icon="🛡️" tone="green" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all ${
              activeTab === tab
                ? "bg-[var(--brand)] text-[var(--bg)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--heading)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <MapPanel tourists={tourists} zones={zones} />
            <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-[var(--heading)]">Live Incidents</h2>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                  <span className="text-xs text-[var(--text-muted)]">
                    {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}
                  </span>
                </div>
              </div>
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {alerts.slice(0, 10).map((a) => <AlertCard key={a._id || a.id || a.createdAt} alert={a} />)}
                {!alerts.length && <p className="text-sm text-[var(--text-muted)]">No active alerts ✅</p>}
              </div>
            </section>
          </div>

          {criticalTourists.length > 0 && (
            <section className="rounded-2xl bg-[var(--surface)] border-2 border-[var(--danger)] p-6 shadow-[var(--shadow-soft)]">
              <h2 className="text-lg font-bold text-[var(--danger)] mb-4">🚨 Critical Tourists — Immediate Action Required</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {criticalTourists.map((t) => (
                  <div key={t.touristId} className="rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)] p-4">
                    <p className="font-bold text-[var(--heading)]">{t.fullName}</p>
                    <p className="font-mono text-xs text-[var(--text-muted)] mb-2">{t.touristId}</p>
                    <p className="text-xs text-[var(--text)]">📞 {t.emergencyContact}</p>
                    {t.lastKnownLocation && (
                      <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
                        📍 {Number(t.lastKnownLocation.latitude).toFixed(4)}, {Number(t.lastKnownLocation.longitude).toFixed(4)}
                      </p>
                    )}
                    <div className="mt-2"><StatusBadge value={t.status} /></div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Tourists ── */}
      {activeTab === "tourists" && (
        <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-semibold text-[var(--heading)]">Tourist Watchlist</h2>
            <input
              placeholder="Search by name or ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-9 w-64 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--text)] outline-none focus-visible:border-[var(--brand)] transition-all"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  <th className="pb-3 pl-2 pr-4">Tourist</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Safety Score</th>
                  <th className="pb-3 pr-4">Last Location</th>
                  <th className="pb-3 pr-4">Last Seen</th>
                  <th className="pb-3 pr-2">Tracking</th>
                </tr>
              </thead>
              <tbody>
                {filteredTourists.map((t) => <TouristRow key={t.touristId} tourist={t} />)}
              </tbody>
            </table>
            {!filteredTourists.length && (
              <p className="mt-4 text-sm text-[var(--text-muted)]">{searchQuery ? "No tourists match your search." : "No tourists registered yet."}</p>
            )}
          </div>
        </section>
      )}

      {/* ── Alerts ── */}
      {activeTab === "alerts" && (
        <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-semibold text-[var(--heading)]">All Alerts ({filteredAlerts.length})</h2>
            <div className="flex gap-1 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-1">
              {["all", "critical", "warning", "open"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                    filterSeverity === s ? "bg-[var(--brand)] text-[var(--bg)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--heading)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredAlerts.map((a) => <AlertCard key={a._id || a.id || a.createdAt} alert={a} />)}
            {!filteredAlerts.length && <p className="text-sm text-[var(--text-muted)]">No alerts found.</p>}
          </div>
        </section>
      )}

      {/* ── Zones ── */}
      {activeTab === "zones" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <MapPanel tourists={[]} zones={zones} />
          <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold text-[var(--heading)] mb-4">Zone Registry ({zones.length})</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {zones.map((zone) => (
                <div key={zone.zoneId || zone.name} className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 shadow-inner">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-semibold text-[var(--heading)]">{zone.name}</p>
                    <StatusBadge value={zone.severity} />
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${zone.severity === "critical" ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`}
                      style={{ width: zone.severity === "critical" ? "92%" : "60%" }} />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">{zone.radiusMeters}m radius · {zone.type}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{zone.advice}</p>
                </div>
              ))}
              {!zones.length && <p className="text-sm text-[var(--text-muted)]">No risk zones configured.</p>}
            </div>
          </section>
        </div>
      )}

      {loading && status === "authenticated" && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
          Loading dashboard data…
        </div>
      )}
    </div>
  );
}
