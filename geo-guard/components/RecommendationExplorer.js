"use client";

import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Crosshair,
  Heart,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
let mapsLoaderPromise;

const categoryOptions = [
  { id: "all", label: "All" },
  { id: "accommodation", label: "Stay" },
  { id: "hotels", label: "Hotels" },
  { id: "food", label: "Food" },
  { id: "emergency", label: "Emergency" },
];

const sortOptions = [
  { id: "nearest", label: "Nearest first" },
  { id: "rating", label: "Highest rated" },
  { id: "popular", label: "Most popular" },
];

const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#141820" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#c6ccd8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#141820" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3341" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#405064" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b2433" }] },
];

function loadGoogleMaps() {
  if (!googleMapsApiKey) return Promise.reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  if (!mapsLoaderPromise) {
    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: "weekly",
      libraries: ["places"],
    });
    mapsLoaderPromise = loader.load();
  }
  return mapsLoaderPromise;
}

export default function RecommendationExplorer({ location, userId = "guest" }) {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRefs = useRef([]);
  const autocompleteRef = useRef(null);

  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  const [center, setCenter] = useState(normalizeLocation(location));
  const [places, setPlaces] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("nearest");
  const [openNow, setOpenNow] = useState(false);
  const [safeOnly, setSafeOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [distanceKm, setDistanceKm] = useState(5);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");

  const rememberSearch = useCallback((value) => {
    setHistory((current) => {
      const next = [value, ...current.filter((item) => item !== value)].slice(0, 5);
      localStorage.setItem("geoGuardSearchHistory", JSON.stringify(next));
      return next;
    });
  }, []);

  const fetchNearby = useCallback(async (coords, type = category) => {
    if (!coords) return;
    setLoading(true);
    setError("");
    try {
      const response = await axios.get("/api/recommendations/nearby", {
        params: {
          lat: coords.latitude,
          lng: coords.longitude,
          type,
          userId,
          radius: distanceKm * 1000,
        },
      });
      setPlaces(response.data.places || []);
    } catch (err) {
      setError(err.response?.data?.error || "Nearby recommendations are unavailable. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [category, distanceKm, userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCenter((current) => current || normalizeLocation(location));
    }, 0);
    return () => clearTimeout(timer);
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = JSON.parse(localStorage.getItem("geoGuardSearchHistory") || "[]");
      setHistory(stored);
    }, 0);
    axios.get(`/api/recommendations/saved?userId=${encodeURIComponent(userId)}`).then((response) => {
      setSavedIds(new Set((response.data.places || []).map((row) => row.placeId)));
    }).catch(() => {});
    return () => clearTimeout(timer);
  }, [userId]);

  useEffect(() => {
    if (!center) return;
    const timer = setTimeout(() => fetchNearby(center, category), 0);
    return () => clearTimeout(timer);
  }, [center, category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !googleMapsApiKey) return;
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const map = new maps.Map(mapRef.current, {
          center: toGoogleCenter(center),
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          styles: darkMapStyles,
          gestureHandling: "greedy",
        });
        mapInstanceRef.current = map;
        setMapReady(true);

        if (searchInputRef.current && !autocompleteRef.current) {
          autocompleteRef.current = new maps.places.Autocomplete(searchInputRef.current, {
            fields: ["formatted_address", "geometry", "name", "place_id"],
          });
          autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current.getPlace();
            if (!place?.geometry?.location) return;
            const nextQuery = place.formatted_address || place.name || query;
            const nextCenter = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            };
            setQuery(nextQuery);
            rememberSearch(nextQuery);
            setCenter(nextCenter);
          });
        }
      })
      .catch(() => setMapReady(false));

    return () => {
      cancelled = true;
    };
  }, [center, query, rememberSearch]);

  const filteredPlaces = useMemo(() => {
    const maxMeters = distanceKm * 1000;
    const rows = places
      .filter((place) => category === "all" || place.category === category || (category === "hotels" && place.category === "accommodation"))
      .filter((place) => !openNow || place.openNow === true)
      .filter((place) => !safeOnly || place.riskLevel === "low")
      .filter((place) => (place.rating || 0) >= minRating)
      .filter((place) => (place.distanceMeters || 0) <= maxMeters);

    return [...rows].sort((a, b) => {
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "popular") return (b.totalRatings || 0) - (a.totalRatings || 0);
      return (a.distanceMeters || 0) - (b.distanceMeters || 0);
    });
  }, [category, distanceKm, minRating, openNow, places, safeOnly, sortBy]);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !window.google?.maps) return;
    const maps = window.google.maps;
    const map = mapInstanceRef.current;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    markerRefs.current = [];

    const bounds = new maps.LatLngBounds();
    if (center) {
      const userMarker = new maps.Marker({
        map,
        position: toGoogleCenter(center),
        title: "Current search area",
        icon: markerSymbol("#ffffff"),
      });
      markerRefs.current.push(userMarker);
      bounds.extend(toGoogleCenter(center));
    }

    filteredPlaces.forEach((place) => {
      const marker = new maps.Marker({
        map,
        position: { lat: Number(place.latitude), lng: Number(place.longitude) },
        title: place.name,
        icon: markerSymbol(markerColor(place)),
      });
      const info = new maps.InfoWindow({
        content: `<strong>${escapeHtml(place.name)}</strong><br/>${escapeHtml(place.distanceText || "")}<br/>Risk: ${escapeHtml(place.riskLevel)}`,
      });
      marker.addListener("click", () => {
        setSelectedPlace(place);
        info.open({ anchor: marker, map });
      });
      markerRefs.current.push(marker);
      bounds.extend({ lat: Number(place.latitude), lng: Number(place.longitude) });
    });

    if (filteredPlaces.length) map.fitBounds(bounds, 52);
    else if (center) {
      map.setCenter(toGoogleCenter(center));
      map.setZoom(14);
    }
  }, [center, filteredPlaces, mapReady]);

  async function handleSearch(nextQuery = query) {
    const trimmed = nextQuery.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    rememberSearch(trimmed);
    try {
      const response = await axios.get("/api/recommendations/search", {
        params: { q: trimmed, userId, radius: distanceKm * 1000 },
      });
      setCenter(response.data.location.coordinates);
      setPlaces(response.data.places || []);
      setSelectedPlace(null);
    } catch (err) {
      setError(err.response?.data?.error || "That location could not be loaded.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("GPS is not available in this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCenter(coords);
        fetchNearby(coords, category);
      },
      (err) => {
        setError(`GPS permission denied: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice search is ready in the UI, but this browser does not expose speech recognition.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const spoken = event.results?.[0]?.[0]?.transcript || "";
      setQuery(spoken);
      handleSearch(spoken);
    };
    recognition.start();
  }

  async function toggleSaved(place) {
    const next = new Set(savedIds);
    if (next.has(place.placeId)) next.delete(place.placeId);
    else next.add(place.placeId);
    setSavedIds(next);
    try {
      await axios.post("/api/recommendations/saved", {
        userId,
        placeId: place.placeId,
        category: place.category,
        place,
      });
    } catch {
      setSavedIds(savedIds);
      setError("Could not update saved places. Please retry.");
    }
  }

  const featured = selectedPlace || filteredPlaces[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
      <div className="grid min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative flex flex-col border-white/10 lg:border-r">
          <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 p-4 backdrop-blur-xl sm:p-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSearch();
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search places, hotels, restaurants..."
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-12 pr-32 text-sm font-semibold text-white outline-none transition focus:border-white/35 focus:bg-white/[0.1]"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {query ? (
                  <button type="button" onClick={() => setQuery("")} className="grid h-10 w-10 place-items-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Clear search">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
                <button type="button" onClick={startVoiceSearch} className="grid h-10 w-10 place-items-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Voice search">
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                <button type="button" onClick={useCurrentLocation} className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black transition hover:scale-95" aria-label="Use current location">
                  <LocateFixed className="h-4 w-4" />
                </button>
              </div>
            </form>

            {history.length ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setCategory(option.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    category === option.id
                      ? "bg-white text-black"
                      : "border border-white/10 bg-white/[0.05] text-white/70 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-white/70">
                Sort
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black px-3 text-white outline-none">
                  {sortOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-white/70">
                Rating {minRating ? `${minRating}+` : "any"}
                <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(event) => setMinRating(Number(event.target.value))} className="mt-3 w-full accent-white" />
              </label>
              <label className="text-xs font-semibold text-white/70">
                Distance {distanceKm} km
                <input type="range" min="1" max="10" step="1" value={distanceKm} onChange={(event) => setDistanceKm(Number(event.target.value))} className="mt-3 w-full accent-white" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Toggle active={openNow} onClick={() => setOpenNow((value) => !value)} label="Open now" />
                <Toggle active={safeOnly} onClick={() => setSafeOnly((value) => !value)} label="Safe zone" />
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger)]/10 p-4 text-sm text-white">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />
                <div>
                  <p className="font-bold text-[var(--danger)]">Recommendation issue</p>
                  <p className="mt-1 text-white/75">{error}</p>
                  <button onClick={() => center && fetchNearby(center, category)} className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black">Retry</button>
                </div>
              </div>
            ) : null}

            {loading ? <SkeletonList /> : null}

            {!loading && !filteredPlaces.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/65">
                No recommendations match these filters. Try a wider distance or another category.
              </div>
            ) : null}

            <div className="grid gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <AnimatePresence initial={false}>
                {!loading && filteredPlaces.map((place) => (
                  <RecommendationCard
                    key={place.placeId}
                    place={place}
                    active={featured?.placeId === place.placeId}
                    saved={savedIds.has(place.placeId)}
                    onSave={() => toggleSaved(place)}
                    onSelect={() => setSelectedPlace(place)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="relative min-h-[520px] bg-[#10141b]">
          {googleMapsApiKey ? (
            <div ref={mapRef} className="absolute inset-0" />
          ) : (
            <FallbackMap center={center} places={filteredPlaces} onSelect={setSelectedPlace} />
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/65 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Safety map</p>
              <p className="text-sm font-bold">{filteredPlaces.length} trusted recommendations</p>
            </div>
            {loading ? (
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-black shadow-2xl">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : null}
          </div>

          <AnimatePresence>
            {featured ? (
              <motion.div
                key={featured.placeId}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 28, opacity: 0 }}
                className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/78 p-3 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:inset-x-5 sm:bottom-5"
              >
                <div className="flex items-center gap-3">
                  <PlaceImage place={featured} compact />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{featured.name}</p>
                    <p className="mt-1 truncate text-xs text-white/60">{featured.address}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <SafetyBadge place={featured} />
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[0.68rem] font-bold">{featured.distanceText}</span>
                    </div>
                  </div>
                  <NavigateButton place={featured} iconOnly />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function RecommendationCard({ place, active, saved, onSave, onSelect }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onClick={onSelect}
      className={`cursor-pointer overflow-hidden rounded-2xl border bg-white/[0.055] shadow-lg backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.08] ${
        active ? "border-white/35" : "border-white/10"
      }`}
    >
      <PlaceImage place={place} />
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-black text-white">{place.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">{place.address}</p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSave();
            }}
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${
              saved ? "border-[var(--danger)] bg-[var(--danger)] text-white" : "border-white/10 bg-white/5 text-white/70 hover:text-white"
            }`}
            aria-label={saved ? "Remove saved place" : "Save place"}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[0.68rem] font-bold text-white">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            {place.rating ? place.rating.toFixed(1) : "New"}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[0.68rem] font-bold text-white/75">{place.distanceText}</span>
          <span className={`rounded-full px-2 py-1 text-[0.68rem] font-bold ${place.openNow === false ? "bg-[var(--danger)]/15 text-[var(--danger)]" : "bg-[var(--accent)]/15 text-[var(--accent)]"}`}>
            {place.openNow === false ? "Closed" : "Open now"}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[0.68rem] font-bold capitalize text-white/75">{place.category}</span>
        </div>

        <SafetyBadge place={place} />

        <div className="grid grid-cols-2 gap-2">
          <a
            href={place.phone ? `tel:${place.phone}` : `https://www.google.com/search?q=${encodeURIComponent(`${place.name} phone`)}`}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white transition hover:bg-white/10"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <NavigateButton place={place} />
        </div>
      </div>
    </motion.article>
  );
}

function PlaceImage({ place, compact = false }) {
  const src = place.photoRef
    ? `/api/recommendations/photo?ref=${encodeURIComponent(place.photoRef)}&w=640`
    : `https://source.unsplash.com/640x420/?${encodeURIComponent(place.category === "food" ? "restaurant interior" : place.category === "emergency" ? "hospital city" : "hotel room")}`;
  return (
    <div className={`${compact ? "h-16 w-16 rounded-xl" : "h-32 w-full"} shrink-0 overflow-hidden bg-white/10`}>
      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}

function SafetyBadge({ place }) {
  const high = place.riskLevel === "high";
  const medium = place.riskLevel === "medium";
  return (
    <div className={`inline-flex max-w-full items-center gap-2 rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${
      high ? "bg-[var(--danger)]/15 text-[var(--danger)]" : medium ? "bg-[var(--warning)]/15 text-[var(--warning)]" : "bg-[var(--accent)]/15 text-[var(--accent)]"
    }`}>
      {high || medium ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <ShieldCheck className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{place.verifiedSafe ? "Verified safe zone" : place.riskMessage}</span>
    </div>
  );
}

function NavigateButton({ place, iconOnly = false }) {
  const href = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&destination_place_id=${place.placeId}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-black transition hover:scale-95 ${iconOnly ? "w-10" : ""}`}
      aria-label="Navigate"
    >
      <Navigation className="h-4 w-4" />
      {iconOnly ? null : "Navigate"}
    </a>
  );
}

function Toggle({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-xl border px-3 text-xs font-bold transition ${
        active ? "border-white bg-white text-black" : "border-white/10 bg-black text-white/65 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
          <div className="h-32 animate-pulse bg-white/10" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-full animate-pulse rounded bg-white/10" />
            <div className="h-9 w-full animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FallbackMap({ center, places, onSelect }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#10141b]">
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
      {center ? (
        <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white text-black shadow-2xl">
          <Crosshair className="h-5 w-5" />
        </div>
      ) : null}
      {places.slice(0, 16).map((place, index) => (
        <button
          key={place.placeId}
          onClick={() => onSelect(place)}
          className="absolute grid h-9 w-9 place-items-center rounded-full border-2 border-black text-white shadow-xl"
          style={{
            left: `${18 + ((index * 17) % 66)}%`,
            top: `${22 + ((index * 23) % 56)}%`,
            backgroundColor: markerColor(place),
          }}
          title={place.name}
        >
          <MapPin className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function normalizeLocation(location) {
  if (!location) return null;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function toGoogleCenter(coords) {
  return { lat: Number(coords?.latitude || 28.6139), lng: Number(coords?.longitude || 77.209) };
}

function markerColor(place) {
  if (place.category === "emergency") return "#f31260";
  if (place.category === "food") return "#f5a524";
  if (place.riskLevel === "medium") return "#f59e0b";
  if (place.riskLevel === "high") return "#f31260";
  return "#10b981";
}

function markerSymbol(color) {
  if (!window.google?.maps) return undefined;
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 9,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#050505",
    strokeWeight: 2,
  };
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}
