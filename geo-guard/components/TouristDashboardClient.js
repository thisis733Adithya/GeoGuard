"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import IdVerifier from "./IdVerifier";
import MapPanel from "./MapPanel";
import NearbyPlaces from "./NearbyPlaces";
import StatusBadge from "./StatusBadge";
import WeatherWidget from "./WeatherWidget";

export default function TouristDashboardClient() {
  const [touristId, setTouristId] = useState("");
  const [missingTouristId, setMissingTouristId] = useState("");
  const [tourist, setTourist] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    const [touristResponse, alertsResponse, zonesResponse] = await Promise.all([
      fetch(`/api/tourists?touristId=${encodeURIComponent(touristId)}`),
      fetch("/api/alerts"),
      fetch("/api/risk-zones"),
    ]);
    const touristData = await touristResponse.json();
    const alertsData = await alertsResponse.json();
    const zonesData = await zonesResponse.json();

    if (!touristData.tourist) {
      setTourist(null);
      setMissingTouristId(touristId);
      return;
    }

    setMissingTouristId("");
    setTourist(touristData.tourist);
    setAlerts((alertsData.alerts || []).filter((alert) => alert.touristId === touristId));
    setZones(zonesData.zones || []);
  }, [touristId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedTouristId = localStorage.getItem("geoGuardTouristId");
      if (storedTouristId) setTouristId(storedTouristId);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!touristId) return;
    const initial = setTimeout(loadData, 0);
    const timer = setInterval(loadData, 4000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [loadData, touristId]);

  async function updateLocation(location) {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/update-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touristId, ...location }),
    });
    const data = await response.json();
    const zoneText = data.geoFenceMatches?.length
      ? ` Entered: ${data.geoFenceMatches.map((m) => m.zone.name).join(", ")}.`
      : "";
    const alertText = data.alerts?.length ? ` ${data.alerts.length} alert created.` : "";
    setMessage(
      response.ok
        ? `Location updated. Risk: ${data.anomaly.anomalyType}.${zoneText}${alertText}`
        : data.error
    );
    await loadData();
    setLoading(false);
  }

  function shareBrowserLocation() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => updateLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => setMessage(`Location access denied: ${err.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function toggleConsent() {
    if (!tourist) return;
    const next = !tourist.trackingConsent;
    const response = await fetch("/api/tourists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ touristId, trackingConsent: next }),
    });
    const data = await response.json();
    if (response.ok) {
      setTourist(data.tourist);
      setMessage(next ? "Tracking consent enabled." : "Tracking consent disabled.");
    } else {
      setMessage(data.error);
    }
  }

  async function triggerSos() {
    if (!tourist) return;
    setLoading(true);
    setMessage("Acquiring emergency location...");

    const sendSos = async (latitude, longitude) => {
      const response = await fetch("/api/panic-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touristId, latitude, longitude }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? `SOS ${data.incidentCode} sent. ${data.nearestEmergency.name} is ${data.nearestEmergency.distance} away, ETA ${data.nearestEmergency.eta}. Call ${data.nearestEmergency.phone}.`
          : data.error
      );
      await loadData();
      setLoading(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendSos(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          const loc = tourist?.lastKnownLocation;
          if (loc) sendSos(loc.latitude, loc.longitude);
          else { setMessage(`Location denied: ${err.message}`); setLoading(false); }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const loc = tourist?.lastKnownLocation;
      if (loc) sendSos(loc.latitude, loc.longitude);
      else { setMessage("Location unavailable."); setLoading(false); }
    }
  }

  async function createTestZone() {
    if (!tourist?.lastKnownLocation) {
      setMessage("Share your live location first.");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/risk-zones/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: tourist.lastKnownLocation.latitude,
        longitude: tourist.lastKnownLocation.longitude,
      }),
    });
    if (response.ok) {
      setMessage("Test risk zone created at your location! Share location again to trigger geo-fence.");
      await loadData();
    } else {
      const data = await response.json();
      setMessage(`Failed: ${data.error}`);
    }
    setLoading(false);
  }

  const activeWarning = useMemo(
    () => alerts.find((a) => a.severity === "critical" || a.severity === "warning"),
    [alerts]
  );

  const safetyColor =
    !tourist ? "var(--accent)"
    : tourist.safetyScore >= 70 ? "var(--accent)"
    : tourist.safetyScore >= 40 ? "var(--warning)"
    : "var(--danger)";

  // ── Login gate ──────────────────────────────────────────────────────────
  if (!tourist) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-8 text-[var(--text)] shadow-[var(--shadow-soft)]">
        <h2 className="mb-2 text-xl font-bold text-[var(--heading)]">Tourist Dashboard</h2>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          {missingTouristId
            ? `Tourist ID "${missingTouristId}" was not found. Please check your ID and try again.`
            : "Enter your Tourist ID to access your personal safety dashboard."}
        </p>
        <div className="flex gap-3 max-w-sm">
          <input
            type="text"
            placeholder="e.g. TID-2026-ABCDE"
            value={touristId}
            onChange={(e) => setTouristId(e.target.value.toUpperCase())}
            className="flex-1 min-h-[2.75rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[var(--text)] font-mono outline-none transition-all focus-visible:border-[var(--brand)] focus-visible:shadow-[0_0_0_1px_var(--brand)]"
          />
          <button
            onClick={() => { if (touristId) { localStorage.setItem("geoGuardTouristId", touristId); loadData(); } }}
            className="rounded-lg bg-[var(--brand)] px-5 font-bold text-[var(--bg)] shadow-sm transition-all hover:-translate-y-0.5"
          >
            Load
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Critical warning banner */}
      {activeWarning ? (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 p-4 shadow-inner">
          <span className="text-2xl shrink-0">🚨</span>
          <div>
            <p className="font-bold text-[var(--danger)]">Active Safety Alert</p>
            <p className="text-sm text-[var(--text)] mt-0.5">{activeWarning.message}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{activeWarning.suggestion}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">

          {/* Profile card */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-[var(--text-muted)]">{tourist.touristId}</p>
                <h2 className="mt-1 text-2xl font-bold text-[var(--heading)]">{tourist.fullName}</h2>
                <p className="text-sm text-[var(--text-muted)]">{tourist.phone}</p>
              </div>
              <StatusBadge value={tourist.status} />
            </div>

            {/* Safety score ring */}
            <div className="mt-5 flex items-center gap-5">
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={safetyColor}
                    strokeWidth="2.5"
                    strokeDasharray={`${tourist.safetyScore} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-[var(--heading)]">{tourist.safetyScore}</span>
                  <span className="text-[0.55rem] text-[var(--text-muted)] uppercase tracking-wide">score</span>
                </div>
              </div>
              <div className="grid gap-2 flex-1">
                <Info label="Trip Window" value={`${tourist.tripStartDate} → ${tourist.tripEndDate}`} />
                <Info label="Emergency Contact" value={tourist.emergencyContact} />
              </div>
            </div>
          </div>

          {/* Consent toggle */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--heading)]">Tracking Consent</h3>
                <p className="text-xs text-[var(--text-muted)]">Opt-in location sharing for your trip duration.</p>
              </div>
              <button
                onClick={toggleConsent}
                className={`relative h-7 w-13 rounded-full border transition-colors ${
                  tourist.trackingConsent ? "bg-[var(--accent)] border-transparent" : "bg-[var(--bg)] border-[var(--border)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                    tourist.trackingConsent ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={shareBrowserLocation}
              disabled={loading || !tourist.trackingConsent}
              className="min-h-14 rounded-xl bg-[var(--brand)] px-6 font-bold text-[var(--bg)] shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              📍 Share Live Location
            </button>
            <button
              onClick={createTestZone}
              disabled={loading || !tourist.lastKnownLocation}
              className="min-h-14 rounded-xl border-2 border-[var(--warning)] bg-[var(--warning)]/10 px-6 font-bold text-[var(--warning)] transition-all hover:-translate-y-1 hover:bg-[var(--warning)] hover:text-[var(--bg)] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              🗺️ Drop Test Zone
            </button>
          </div>
          <button
            onClick={triggerSos}
            disabled={loading}
            className="min-h-16 w-full rounded-2xl bg-[var(--danger)] px-6 text-xl font-black text-white shadow-xl transition-all hover:-translate-y-1 hover:opacity-90 disabled:opacity-50 disabled:hover:translate-y-0 animate-pulse-sos"
          >
            🆘 PANIC SOS
          </button>

          {message ? (
            <div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 text-sm text-[var(--text)] shadow-inner">
              {message}
            </div>
          ) : null}

          {/* Digital ID verifier */}
          <IdVerifier initialTouristId={tourist.touristId} />

          {/* Alert history */}
          <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
            <h3 className="text-base font-semibold text-[var(--heading)]">Alert History</h3>
            <div className="mt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
              {alerts.length ? (
                alerts.map((alert) => (
                  <div key={alert._id || alert.id || alert.createdAt} className="rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 shadow-inner">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[var(--heading)] capitalize">{alert.type}</span>
                      <StatusBadge value={alert.severity} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{alert.message}</p>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">{new Date(alert.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No alerts yet. You are safe! ✅</p>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">
          {/* Map */}
          <MapPanel tourists={[tourist]} zones={zones} selectedLocation={tourist.lastKnownLocation} />

          {/* Weather */}
          <WeatherWidget location={tourist.lastKnownLocation} />

          {/* Nearby places */}
          <NearbyPlaces location={tourist.lastKnownLocation} />

          {/* Active risk zones near tourist */}
          {zones.length > 0 && (
            <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
              <h3 className="text-base font-semibold text-[var(--heading)]">Active Risk Zones</h3>
              <div className="mt-3 space-y-3">
                {zones.map((zone) => (
                  <div key={zone.zoneId || zone.name} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 shadow-inner">
                    <div>
                      <p className="text-sm font-semibold text-[var(--heading)]">{zone.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{zone.radiusMeters}m radius · {zone.advice}</p>
                    </div>
                    <StatusBadge value={zone.severity} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--bg)] border border-[var(--border)] px-3 py-2 shadow-inner">
      <p className="text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}
