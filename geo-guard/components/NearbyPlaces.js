"use client";

import { useEffect, useState } from "react";

const PRICE = ["", "₹", "₹₹", "₹₹₹", "₹₹₹₹"];

function StarRating({ rating }) {
  if (!rating) return <span className="text-xs text-[var(--text-muted)]">No rating</span>;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-1">
      <span className="text-yellow-400 text-sm">
        {"★".repeat(full)}
        {half ? "½" : ""}
        {"☆".repeat(5 - full - (half ? 1 : 0))}
      </span>
      <span className="text-xs text-[var(--text-muted)]">{rating.toFixed(1)}</span>
    </span>
  );
}

function PlaceCard({ place }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.id}`;
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1.5 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-4 shadow-inner transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--heading)] leading-snug">{place.name}</p>
        {place.priceLevel ? (
          <span className="text-xs font-medium text-[var(--accent)] shrink-0">{PRICE[place.priceLevel]}</span>
        ) : null}
      </div>
      <StarRating rating={place.rating} />
      {place.address ? (
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{place.address}</p>
      ) : null}
      <div className="flex items-center justify-between gap-2 mt-1">
        {place.open !== null ? (
          <span className={`text-xs font-semibold ${place.open ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
            {place.open ? "Open Now" : "Closed"}
          </span>
        ) : <span />}
        <span className="text-xs text-[var(--brand)] font-medium">View on Maps →</span>
      </div>
    </a>
  );
}

export default function NearbyPlaces({ location }) {
  const [tab, setTab] = useState("restaurant");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    setLoading(true);
    setError("");
    fetch(`/api/nearby-places?lat=${location.latitude}&lng=${location.longitude}&type=${tab}`)
      .then((r) => r.json())
      .then((data) => {
        setPlaces(data.places || []);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load nearby places.");
        setLoading(false);
      });
  }, [location?.latitude, location?.longitude, tab]);

  if (!location) {
    return (
      <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-lg font-semibold text-[var(--heading)]">Nearby Places</h2>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Share your live location to see nearby hotels and restaurants.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 shadow-[var(--shadow-soft)] transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--heading)]">Nearby Places</h2>
          <p className="text-xs text-[var(--text-muted)]">Trusted spots within 1.5 km of your location</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-[var(--bg)] border border-[var(--border)] p-1">
          {[
            { id: "restaurant", label: "🍽️ Food" },
            { id: "lodging", label: "🏨 Stay" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-[var(--brand)] text-[var(--bg)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--heading)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--brand)]" />
            Searching nearby…
          </div>
        ) : error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : places.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No {tab === "lodging" ? "hotels" : "restaurants"} found nearby.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
