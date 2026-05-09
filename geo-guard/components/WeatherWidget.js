"use client";

import { useEffect, useState } from "react";

export default function WeatherWidget({ location }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    setLoading(true);
    fetch(`/api/weather?lat=${location.latitude}&lng=${location.longitude}`)
      .then((r) => r.json())
      .then((data) => {
        setWeather(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [location?.latitude, location?.longitude]);

  if (!location) return null;

  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-[var(--shadow-soft)] transition-all">
      <h2 className="text-base font-semibold text-[var(--heading)]">Weather & Safety</h2>
      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
          Fetching weather…
        </div>
      ) : weather && !weather.error ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{weather.icon}</span>
            <div>
              <p className="text-2xl font-black text-[var(--heading)]">{weather.temperature}°C</p>
              <p className="text-sm text-[var(--text-muted)]">{weather.description}</p>
            </div>
            <div className="ml-auto grid gap-1 text-right">
              <p className="text-xs text-[var(--text-muted)]">💨 {weather.wind} km/h</p>
              <p className="text-xs text-[var(--text-muted)]">💧 {weather.humidity}%</p>
            </div>
          </div>
          <p className="rounded-xl bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] shadow-inner">
            {weather.safetyTip}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--text-muted)]">Weather data unavailable.</p>
      )}
    </div>
  );
}
