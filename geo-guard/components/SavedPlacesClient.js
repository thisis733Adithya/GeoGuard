"use client";

import axios from "axios";
import { Heart, Navigation, Star } from "lucide-react";
import { useEffect, useState } from "react";

export default function SavedPlacesClient() {
  const [userId, setUserId] = useState("guest");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("geoGuardTouristId") || "guest";
    const timer = setTimeout(() => setUserId(stored), 0);
    axios.get(`/api/recommendations/saved?userId=${encodeURIComponent(stored)}`)
      .then((response) => setPlaces(response.data.places || []))
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, []);

  async function remove(placeId) {
    const row = places.find((item) => item.placeId === placeId);
    setPlaces((current) => current.filter((item) => item.placeId !== placeId));
    await axios.post("/api/recommendations/saved", {
      userId,
      placeId,
      category: row?.category || "saved",
      place: row?.place || {},
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        Loading saved places...
      </div>
    );
  }

  if (!places.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
        No saved places yet. Save hotels, restaurants, and emergency services from the tourist dashboard.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {places.map((row) => {
        const place = row.place || {};
        return (
          <article key={row.placeId} className="rounded-2xl border border-white/10 bg-black/70 p-4 text-white shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">{row.category}</p>
                <h2 className="mt-1 text-base font-black">{place.name || row.placeId}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-white/60">{place.address || "Saved Geo Guard recommendation"}</p>
              </div>
              <button onClick={() => remove(row.placeId)} className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--danger)] text-white" aria-label="Remove saved place">
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              {place.rating ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {place.rating.toFixed(1)}
                </span>
              ) : null}
              {place.distanceText ? <span className="rounded-full bg-white/10 px-2 py-1">{place.distanceText}</span> : null}
              {place.riskLevel ? <span className="rounded-full bg-[var(--accent)]/15 px-2 py-1 text-[var(--accent)]">{place.riskLevel} risk</span> : null}
            </div>
            {place.latitude && place.longitude ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${row.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-black"
              >
                <Navigation className="h-4 w-4" />
                Navigate
              </a>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
