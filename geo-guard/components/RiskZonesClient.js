"use client";

import { useEffect, useState } from "react";
import MapPanel from "./MapPanel";
import StatusBadge from "./StatusBadge";

export default function RiskZonesClient() {
  const [zones, setZones] = useState([]);

  useEffect(() => {
    async function loadZones() {
      const response = await fetch("/api/risk-zones");
      const data = await response.json();
      setZones(data.zones || []);
    }
    loadZones();
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <MapPanel zones={zones} compact />
      <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] transition-all">
        <h2 className="text-lg font-semibold text-[var(--heading)]">Monitored Risk Zones</h2>
        <div className="mt-4 space-y-3">
          {zones.map((zone) => (
            <article key={zone.zoneId || zone.name} className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-5 shadow-inner transition-all hover:-translate-y-1 hover:border-[var(--border-strong)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--heading)]">{zone.name}</h3>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{zone.type}</p>
                </div>
                <StatusBadge value={zone.severity} />
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[var(--text)] sm:grid-cols-2">
                <p>Lat: {zone.latitude}</p>
                <p>Lng: {zone.longitude}</p>
                <p>Radius: {zone.radiusMeters}m</p>
                <p className="col-span-1 sm:col-span-2 text-[var(--text-muted)]">{zone.advice}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
