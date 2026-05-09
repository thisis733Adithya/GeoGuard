"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StatusBadge from "./StatusBadge";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
let googleMapsPromise;

function loadGoogleMaps() {
  if (!googleMapsApiKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector("[data-geo-guard-google-maps='true']");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      googleMapsApiKey
    )}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.geoGuardGoogleMaps = "true";
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function project(latitude, longitude) {
  const minLat = 28.5;
  const maxLat = 28.68;
  const minLng = 77.16;
  const maxLng = 77.27;
  const x = ((longitude - minLng) / (maxLng - minLng)) * 100;
  const y = 100 - ((latitude - minLat) / (maxLat - minLat)) * 100;
  return {
    left: `${Math.min(94, Math.max(4, x))}%`,
    top: `${Math.min(92, Math.max(6, y))}%`,
  };
}

function getMapCenter(tourists, selectedLocation) {
  return (
    selectedLocation ||
    tourists.find((tourist) => tourist.lastKnownLocation)?.lastKnownLocation || {
      latitude: 28.6139,
      longitude: 77.209,
    }
  );
}

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export default function MapPanel({ tourists = [], zones = [], selectedLocation, compact = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapError, setMapError] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapCenter = useMemo(() => getMapCenter(tourists, selectedLocation), [tourists, selectedLocation]);
  const mapUrl = `https://www.google.com/maps?q=${mapCenter.latitude},${mapCenter.longitude}&z=13&output=embed`;
  const canUseGoogleMaps = Boolean(googleMapsApiKey);

  const touristMarkers = tourists
    .filter((tourist) => tourist.lastKnownLocation)
    .map((tourist) => ({
      id: tourist.touristId,
      label: tourist.fullName,
      status: tourist.status,
      latitude: tourist.lastKnownLocation.latitude,
      longitude: tourist.lastKnownLocation.longitude,
      ...project(tourist.lastKnownLocation.latitude, tourist.lastKnownLocation.longitude),
    }));

  const zoneMarkers = zones.map((zone) => ({
    id: zone.zoneId || zone.name,
    label: zone.name,
    severity: zone.severity,
    latitude: zone.latitude,
    longitude: zone.longitude,
    radiusMeters: zone.radiusMeters,
    advice: zone.advice,
    ...project(zone.latitude, zone.longitude),
  }));

  const selected = selectedLocation ? project(selectedLocation.latitude, selectedLocation.longitude) : null;
  const mapDataKey = JSON.stringify({
    tourists: touristMarkers.map(({ id, status, latitude, longitude }) => ({ id, status, latitude, longitude })),
    zones: zoneMarkers.map(({ id, severity, latitude, longitude, radiusMeters }) => ({ id, severity, latitude, longitude, radiusMeters })),
  });

  // 1. Initialize Map exactly ONCE
  useEffect(() => {
    if (!canUseGoogleMaps || !mapRef.current || mapInstanceRef.current) return;

    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        setMapError("");
        const isDark = document.documentElement.dataset.theme !== "light";
        const map = new maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.209 },
          zoom: compact ? 12 : 13,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          styles: isDark ? darkMapStyles : [],
        });
        mapInstanceRef.current = map;
        setMapLoaded(true);
      })
      .catch((error) => {
        if (!cancelled) setMapError(error.message);
      });

    return () => { cancelled = true; };
  }, [canUseGoogleMaps, compact]);

  // 2. Sync markers and bounds when data changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;
    const maps = window.google.maps;

    // Clear old markers
    markersRef.current.forEach((item) => {
      if (typeof item.setMap === "function") item.setMap(null);
      if (typeof item.close === "function") item.close();
    });
    markersRef.current = [];

    const bounds = new maps.LatLngBounds();
    let hasItems = false;

    zoneMarkers.forEach((zone) => {
      const position = { lat: Number(zone.latitude), lng: Number(zone.longitude) };
      const circle = new maps.Circle({
        map,
        center: position,
        radius: Number(zone.radiusMeters || 500),
        strokeColor: zone.severity === "critical" ? "#f31260" : "#f5a524",
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: zone.severity === "critical" ? "#f31260" : "#f5a524",
        fillOpacity: 0.22,
      });
      const marker = new maps.Marker({
        map,
        position,
        title: zone.label,
        label: { text: zone.severity === "critical" ? "!" : "Z", color: "#ffffff", fontWeight: "700" },
      });
      const info = new maps.InfoWindow({
        content: `<strong>${zone.label}</strong><br/>${zone.radiusMeters}m radius<br/>${zone.advice || ""}`,
      });
      marker.addListener("click", () => info.open({ anchor: marker, map }));
      markersRef.current.push(circle, marker, info);
      bounds.extend(position);
      hasItems = true;
    });

    touristMarkers.forEach((tourist) => {
      const position = { lat: Number(tourist.latitude), lng: Number(tourist.longitude) };
      const marker = new maps.Marker({
        map,
        position,
        title: tourist.label,
        label: { text: tourist.status === "critical" ? "S" : "T", color: "#ffffff", fontWeight: "700" },
      });
      const info = new maps.InfoWindow({
        content: `<strong>${tourist.label}</strong><br/>Status: ${tourist.status || "active"}`,
      });
      marker.addListener("click", () => info.open({ anchor: marker, map }));
      markersRef.current.push(marker, info);
      bounds.extend(position);
      hasItems = true;
    });

    // Precision Zooming Logic
    if (selectedLocation) {
      map.setCenter({ lat: Number(selectedLocation.latitude), lng: Number(selectedLocation.longitude) });
      map.setZoom(15);
    } else if (hasItems) {
      map.fitBounds(bounds, 48);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, mapDataKey, selectedLocation]);

  return (
    <section className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-[var(--shadow-soft)] transition-all">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--heading)]">Live Safety Map</h2>
          <p className="text-xs text-[var(--text-muted)]">
            {canUseGoogleMaps && !mapError
              ? "Google Maps live markers with tourist and risk-zone overlays"
              : "Demo map fallback with local tourist and risk-zone overlays"}
          </p>
        </div>
        <StatusBadge value={canUseGoogleMaps && !mapError ? "google maps" : "fallback"} />
      </div>
      <div
        className={`relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)] shadow-inner ${
          compact ? "h-64" : "h-[420px]"
        }`}
      >
        {canUseGoogleMaps && !mapError ? (
          <div ref={mapRef} className="absolute inset-0 h-full w-full" />
        ) : (
          <FallbackMap
            mapUrl={mapUrl}
            touristMarkers={touristMarkers}
            zoneMarkers={zoneMarkers}
            selected={selected}
          />
        )}

        {mapError ? (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-[var(--warning)] bg-[var(--bg)] p-3 text-sm font-medium text-[var(--warning)] shadow-[var(--shadow-soft)] backdrop-blur-md">
            {mapError}. Showing fallback map.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FallbackMap({ mapUrl, touristMarkers, zoneMarkers, selected }) {
  return (
    <>
      <iframe
        title="Google Maps tourist safety view"
        src={mapUrl}
        className="absolute inset-0 h-full w-full border-0 opacity-20 grayscale"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(var(--border-strong)_1px,transparent_1px)] bg-[size:20px_20px]" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--border-strong)]" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--border-strong)]" />

      {zoneMarkers.map((zone) => (
        <div
          key={zone.id}
          className={`absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border ${
            zone.severity === "critical"
              ? "border-[var(--danger)] bg-[var(--danger)]/20"
              : "border-[var(--warning)] bg-[var(--warning)]/20"
          }`}
          style={{ left: zone.left, top: zone.top }}
          title={zone.label}
        />
      ))}

      {touristMarkers.map((marker) => (
        <div
          key={marker.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: marker.left, top: marker.top }}
          title={marker.label}
        >
          <span
            className={`block h-4 w-4 rounded-full border-2 border-[var(--bg)] shadow-lg ${
              marker.status === "critical"
                ? "bg-[var(--danger)]"
                : marker.status === "watch"
                  ? "bg-[var(--warning)]"
                  : "bg-[var(--accent)]"
            }`}
          />
        </div>
      ))}

      {selected ? (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--bg)] bg-[var(--brand)] p-1 shadow-lg"
          style={{ left: selected.left, top: selected.top }}
          title="Current browser location"
        />
      ) : null}

      {!touristMarkers.length && !selected ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-[var(--text-muted)]">
          Waiting for location updates
        </div>
      ) : null}
    </>
  );
}
