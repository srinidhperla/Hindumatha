import React, { useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [18.1067, 83.3956];
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const MapRecenter = ({ center }) => {
  const map = useMap();
  map.setView(center, map.getZoom(), { animate: true });
  return null;
};

const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

const StoreLocationPicker = ({ lat, lng, radiusKm, onPickLocation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const normalizedLat = Number(lat);
  const normalizedLng = Number(lng);
  const hasCoordinates =
    Number.isFinite(normalizedLat) && Number.isFinite(normalizedLng);

  const center = useMemo(
    () => (hasCoordinates ? [normalizedLat, normalizedLng] : DEFAULT_CENTER),
    [hasCoordinates, normalizedLat, normalizedLng],
  );

  const handleSearch = async (event) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 3) {
      setSearchError("Type at least 3 characters to search.");
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    try {
      const response = await fetch(
        `${NOMINATIM_BASE_URL}/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(
          trimmedQuery,
        )}`,
      );
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const results = await response.json();
      setSearchResults(Array.isArray(results) ? results : []);
      if (!results?.length) {
        setSearchError(
          "No locations found. Try a nearby landmark or locality.",
        );
      }
    } catch (error) {
      setSearchResults([]);
      setSearchError("Unable to search locations right now.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const nextLat = Number(result.lat);
    const nextLng = Number(result.lon);
    if (!Number.isFinite(nextLat) || !Number.isFinite(nextLng)) {
      return;
    }

    onPickLocation(nextLat, nextLng);
    setSearchQuery(result.display_name || "");
    setSearchResults([]);
    setSearchError("");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-3">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search area, landmark, street or city"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <button
            type="submit"
            disabled={searchLoading}
            className="rounded-xl border border-pink-200 px-4 py-2 text-sm font-semibold text-pink-700 admin-motion hover:bg-pink-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {searchError && (
          <p className="mt-2 text-xs font-medium text-amber-700">
            {searchError}
          </p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white">
            {searchResults.map((result) => (
              <button
                key={`${result.place_id}-${result.osm_id || ""}`}
                type="button"
                onClick={() => handleSelectSearchResult(result)}
                className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 admin-motion hover:bg-slate-50"
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={hasCoordinates ? 15 : 12}
        scrollWheelZoom
        style={{ height: "320px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter center={center} />
        <ClickHandler onPick={onPickLocation} />

        {hasCoordinates && (
          <>
            <Marker position={center} icon={markerIcon}>
              <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                Store location
              </Tooltip>
            </Marker>
            <Circle
              center={center}
              radius={Math.max(0, Number(radiusKm) || 0) * 1000}
              pathOptions={{
                color: "#ec4899",
                fillColor: "#f9a8d4",
                fillOpacity: 0.2,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default StoreLocationPicker;
