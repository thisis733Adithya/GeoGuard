"use client";

import { useCallback, useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";

export default function AlertsClient() {
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = useCallback(async () => {
    const response = await fetch("/api/alerts");
    const data = await response.json();
    setAlerts(data.alerts || []);
  }, []);

  useEffect(() => {
    const initial = setTimeout(loadAlerts, 0);
    const timer = setInterval(loadAlerts, 4000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadAlerts]);

  return (
    <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] transition-all">
      <div className="space-y-3">
        {alerts.length ? (
          alerts.map((alert) => (
            <article key={alert._id || alert.id || alert.createdAt} className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-5 shadow-inner transition-colors hover:border-[var(--border-strong)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--heading)]">{alert.type}</p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">{alert.touristId}</p>
                </div>
                <StatusBadge value={alert.severity} />
              </div>
              <p className="mt-3 text-sm text-[var(--text)]">{alert.message}</p>
              <p className="mt-1 text-sm text-[var(--heading)]">{alert.suggestion}</p>
              <p className="mt-3 text-xs text-[var(--text-soft)]">{new Date(alert.createdAt).toLocaleString()}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-[var(--text-muted)]">No alert records yet.</p>
        )}
      </div>
    </section>
  );
}
